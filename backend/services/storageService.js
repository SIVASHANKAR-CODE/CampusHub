import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB, isDbConnected } from '../config/db.js';
import MediaFile from '../models/MediaFile.js';
import { getUploadDir } from '../utils/uploads.js';

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

// Check if Cloudinary is configured with valid production/dev credentials
export function isCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
    return true;
  }

  return Boolean(
    cloudName &&
    cloudName !== 'your_cloud_name' &&
    cloudName !== 'demo' &&
    apiKey &&
    apiKey !== 'your_api_key' &&
    apiSecret &&
    apiSecret !== 'your_api_secret'
  );
}

// Lazy configure Cloudinary
let cloudinaryInitialized = false;
function ensureCloudinaryConfig() {
  if (cloudinaryInitialized) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    cloudinaryInitialized = true;
    return;
  }
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryInitialized = true;
  }
}

/**
 * Uploads a buffer to Cloudinary using a stream.
 */
function uploadToCloudinaryStream(buffer, options = {}) {
  ensureCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'campushub',
        resource_type: options.resource_type || options.resourceType || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Persist an uploaded file buffer.
 * TIER 1: Cloudinary (if credentials are provided)
 * TIER 2: MongoDB Atlas MediaFile persistent binary storage (permanent across cold starts and deployments)
 */
export async function saveUploadedFile({
  buffer,
  originalname = 'file',
  mimetype = 'application/octet-stream',
  size,
  uploadedBy = null,
  folder = 'campushub',
}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('A valid file buffer is required for storage.');
  }

  const effectiveSize = size || buffer.length;
  let ext = path.extname(originalname || '').toLowerCase();
  if (!ext || ext === '.') {
    ext = MIME_TO_EXT[mimetype] || '.jpg';
  }
  const filename = `file-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

  // Attempt Tier 1: Cloudinary if credentials are configured
  if (isCloudinaryConfigured()) {
    try {
      const isPdf = mimetype === 'application/pdf';
      const cldResult = await uploadToCloudinaryStream(buffer, {
        folder: `campushub/${folder}`,
        resource_type: isPdf ? 'raw' : 'image',
        public_id: filename.replace(/\.[^/.]+$/, ''),
      });

      if (cldResult?.secure_url) {
        // Also log metadata in MongoDB for tracking and audit
        try {
          if (!isDbConnected()) await connectDB();
          await MediaFile.findOneAndUpdate(
            { filename },
            {
              filename,
              originalname,
              mimetype,
              size: effectiveSize,
              data: buffer, // retain backup buffer in MongoDB
              uploadedBy,
              cloudinaryUrl: cldResult.secure_url,
              cloudinaryPublicId: cldResult.public_id,
            },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('[STORAGE] Cloudinary succeeded; MediaFile metadata sync non-fatal warning:', dbErr.message);
        }

        return {
          url: cldResult.secure_url,
          filename,
          size: effectiveSize,
          mimetype,
          provider: 'cloudinary',
          publicId: cldResult.public_id,
        };
      }
    } catch (cldErr) {
      console.warn('[STORAGE] Cloudinary upload failed, falling back to persistent MongoDB storage:', cldErr.message);
    }
  }

  // Tier 2: Persistent MongoDB Atlas MediaFile storage
  try {
    if (!isDbConnected()) await connectDB();
    await MediaFile.findOneAndUpdate(
      { filename },
      {
        filename,
        originalname,
        mimetype,
        size: effectiveSize,
        data: buffer,
        uploadedBy,
      },
      { upsert: true, new: true }
    );
  } catch (mongoErr) {
    console.error('[STORAGE] Failed to persist file to MongoDB:', mongoErr.message);
    throw new Error('Could not persist file to database storage: ' + mongoErr.message);
  }

  // Also write to local cache if possible (speeds up local dev)
  try {
    const localPath = path.join(getUploadDir(), filename);
    fs.writeFileSync(localPath, buffer);
  } catch {
    // Disk write failures in read-only /tmp or serverless are ignored; MongoDB is the source of truth
  }

  return {
    url: `/uploads/${filename}`,
    filename,
    size: effectiveSize,
    mimetype,
    provider: 'mongodb',
  };
}

function extractBinaryBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data.buffer && Buffer.isBuffer(data.buffer)) return data.buffer;
  if (typeof data.value === 'function') {
    const val = data.value(true);
    if (Buffer.isBuffer(val)) return val;
    return Buffer.from(val);
  }
  if (data instanceof Uint8Array || Array.isArray(data)) {
    return Buffer.from(data);
  }
  try {
    const b = Buffer.from(data);
    return b.length > 0 ? b : null;
  } catch {
    return null;
  }
}

/**
 * Retrieve a stored file by filename.
 * Checks local disk first; if not found (e.g. Vercel serverless container cold start),
 * retrieves from MongoDB Atlas MediaFile collection.
 */
export async function getStoredFile(filename) {
  if (!filename || typeof filename !== 'string') return null;
  const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeFilename) return null;

  // 1. Check local upload directory (local dev cache)
  try {
    const localPath = path.join(getUploadDir(), safeFilename);
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      const ext = path.extname(safeFilename).toLowerCase();
      const extToMime = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
      };
      return {
        buffer: fs.readFileSync(localPath),
        mimetype: extToMime[ext] || 'application/octet-stream',
        size: stats.size,
        filename: safeFilename,
      };
    }
  } catch {
    // Disk check error, fall through to MongoDB
  }

  // 2. Query MongoDB Atlas MediaFile
  try {
    if (!isDbConnected()) await connectDB();
    const media = await MediaFile.findOne({ filename: safeFilename }).lean();
    if (media) {
      if (media.cloudinaryUrl) {
        return {
          cloudinaryUrl: media.cloudinaryUrl,
          mimetype: media.mimetype || 'image/jpeg',
          size: media.size,
          filename: media.filename,
        };
      }
      if (media.data) {
        const fileBuffer = extractBinaryBuffer(media.data);
        if (fileBuffer && fileBuffer.length > 0) {
          return {
            buffer: fileBuffer,
            mimetype: media.mimetype || 'image/jpeg',
            size: media.size || fileBuffer.length,
            filename: media.filename,
            updatedAt: media.updatedAt,
          };
        }
      }
    }
  } catch (err) {
    console.error('[STORAGE] Error fetching file from MongoDB MediaFile:', err.message);
  }

  return null;
}

/**
 * Validate whether a hostname belongs to Cloudinary (exact domain or legitimate subdomain).
 * Rejects lookalike hostnames like evilcloudinary.com or fake-cloudinary.com.
 */
function isCloudinaryHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const lower = hostname.toLowerCase();
  return lower === 'cloudinary.com' || lower.endsWith('.cloudinary.com');
}

/**
 * Safely extracts the Cloudinary public_id and resource_type from a Cloudinary URL.
 * Handles delivery prefixes, transformations (e.g. c_fill,w_300), version tags (v123...),
 * variable folder structures, and extensions without assuming a fixed directory depth.
 * Rejects lookalike hostnames, malformed percent encoding, and path traversal attempts.
 */
export function extractCloudinaryAssetInfo(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  // Immediate rejection of directory traversal attempts in raw URL
  if (/\.\.|\%2e\%2e/i.test(fileUrl)) return null;

  try {
    const parsed = new URL(fileUrl);
    if (!isCloudinaryHost(parsed.hostname)) return null;

    const rawSegments = parsed.pathname.split('/').filter(Boolean);
    if (rawSegments.length < 3) return null;

    // Locate the delivery type ('upload', 'authenticated', 'private')
    const deliveryIndex = rawSegments.findIndex((s, idx) => idx >= 1 && ['upload', 'authenticated', 'private'].includes(s));
    if (deliveryIndex === -1 || deliveryIndex >= rawSegments.length - 1) {
      return null;
    }

    // Determine resource type ('image', 'raw', 'video') if present before delivery type
    const candidateType = rawSegments[deliveryIndex - 1]?.toLowerCase();
    const resourceType = ['image', 'raw', 'video'].includes(candidateType)
      ? candidateType
      : ['image', 'raw', 'video'].includes(rawSegments[1]?.toLowerCase())
        ? rawSegments[1].toLowerCase()
        : 'image';

    let remaining = rawSegments.slice(deliveryIndex + 1);

    // Skip version tag (e.g. 'v1792004323') and any transformations before it
    const versionIndex = remaining.findIndex((s) => /^v\d+$/.test(s));
    if (versionIndex !== -1) {
      remaining = remaining.slice(versionIndex + 1);
    } else {
      // If no version segment is found, strip leading transformation parameters
      while (
        remaining.length > 1 &&
        (remaining[0].includes(',') || /^[a-z]{1,3}_[a-zA-Z0-9_-]+$/.test(remaining[0]))
      ) {
        remaining.shift();
      }
    }

    if (remaining.length === 0) return null;

    // Safely decode each path segment individually to reject invalid percent encoding
    const decodedSegments = [];
    for (const segment of remaining) {
      try {
        const decoded = decodeURIComponent(segment);
        // Reject segment traversal or forbidden characters
        if (!decoded || decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\')) {
          return null;
        }
        decodedSegments.push(decoded);
      } catch {
        // Invalid percent encoding (e.g. %E0%A4%A or malformed % sequences)
        return null;
      }
    }

    if (decodedSegments.length === 0) return null;

    const fullPath = decodedSegments.join('/');
    const lastDot = fullPath.lastIndexOf('.');
    const publicId = lastDot > 0 ? fullPath.slice(0, lastDot) : fullPath;

    // Reject traversal, relative paths, or suspicious characters
    if (!publicId || publicId.includes('..') || publicId.startsWith('/') || publicId.endsWith('/')) {
      return null;
    }

    return {
      publicId,
      resourceType,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves the appropriate Cloudinary resource_type ('image', 'raw', 'video')
 * by checking stored document mimetype first, then fallback metadata or URL heuristics.
 */
function resolveResourceType(mediaDoc, parsedAsset, fileUrl) {
  const mime = (mediaDoc?.mimetype || '').toLowerCase();
  if (mime) {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'application/pdf' || mime.startsWith('application/') || mime.startsWith('text/')) {
      return 'raw';
    }
  }

  if (parsedAsset?.resourceType && ['image', 'raw', 'video'].includes(parsedAsset.resourceType)) {
    return parsedAsset.resourceType;
  }

  const urlLower = (fileUrl || '').toLowerCase();
  if (/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(urlLower)) return 'video';
  if (/\.(pdf|doc|docx|zip|txt|csv)(\?.*)?$/i.test(urlLower)) return 'raw';

  return 'image';
}

/**
 * Remove an old asset when a user replaces their profile photo or image.
 * Safely ignores seed/demo files, external URLs, or system defaults.
 */
export async function deleteStoredFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return false;

  try {
    let parsedUrl = null;
    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      // Relative URL or non-URL string
    }

    // 1. Cloudinary URL cleanup
    if (parsedUrl && isCloudinaryHost(parsedUrl.hostname)) {
      if (!isDbConnected()) await connectDB();

      // Requirement 1: If Cloudinary is not configured, preserve metadata and return false
      ensureCloudinaryConfig();
      if (!isCloudinaryConfigured()) {
        console.warn(
          '[STORAGE] Cloudinary is not configured; skipping remote asset destruction and preserving database metadata for:',
          fileUrl
        );
        return false;
      }

      // Look up matching MediaFile document by cloudinaryUrl
      const mediaDoc = await MediaFile.findOne({ cloudinaryUrl: fileUrl });

      // Use exact stored public ID if present, otherwise extract from URL
      let publicId = mediaDoc?.cloudinaryPublicId?.trim();
      const parsedAsset = extractCloudinaryAssetInfo(fileUrl);

      if (!publicId && parsedAsset?.publicId) {
        publicId = parsedAsset.publicId;
      }

      if (!publicId) {
        console.warn('[STORAGE] Cannot determine safe Cloudinary publicId for deletion:', fileUrl);
        return false;
      }

      const resourceType = resolveResourceType(mediaDoc, parsedAsset, fileUrl);

      // Execute remote deletion
      try {
        const destroyResult = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        });

        // Requirement 6: Explicit handling of destroy response
        if (destroyResult?.result !== 'ok' && destroyResult?.result !== 'not found') {
          console.warn(
            `[STORAGE] Cloudinary deletion reported non-success for publicId "${publicId}":`,
            destroyResult?.result
          );
          return false;
        }
      } catch (cldErr) {
        // Requirement 6: Log failure and do NOT delete database metadata on failure
        console.warn(
          `[STORAGE] Cloudinary deletion error for publicId "${publicId}":`,
          cldErr.message
        );
        return false;
      }

      // Safe metadata cleanup: Delete only the matching document
      if (mediaDoc) {
        await MediaFile.deleteOne({ _id: mediaDoc._id });
      } else {
        await MediaFile.deleteOne({ cloudinaryUrl: fileUrl });
      }

      return true;
    }

    // 2. Local / Mongo upload URL cleanup (/uploads/...)
    if (fileUrl.startsWith('/uploads/')) {
      const filename = path.basename(fileUrl);
      if (!filename || filename.startsWith('demo-') || filename.includes('sample')) {
        return false; // protect seed/demo files
      }

      if (!isDbConnected()) await connectDB();
      await MediaFile.deleteOne({ filename }).catch(() => {});

      try {
        const localPath = path.join(getUploadDir(), filename);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch {}

      return true;
    }

    // External URLs (e.g. Unsplash, lookalikes, avatars) are not managed assets
    return false;
  } catch (err) {
    console.warn('[STORAGE] Non-fatal error cleaning up old file:', err.message);
    return false;
  }
}
