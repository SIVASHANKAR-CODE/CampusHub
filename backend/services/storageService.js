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
        return {
          buffer: Buffer.isBuffer(media.data) ? media.data : Buffer.from(media.data),
          mimetype: media.mimetype || 'image/jpeg',
          size: media.size || media.data.length,
          filename: media.filename,
          updatedAt: media.updatedAt,
        };
      }
    }
  } catch (err) {
    console.error('[STORAGE] Error fetching file from MongoDB MediaFile:', err.message);
  }

  return null;
}

/**
 * Remove an old asset when a user replaces their profile photo or image.
 * Safely ignores seed/demo files, external URLs, or system defaults.
 */
export async function deleteStoredFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return false;

  try {
    // Cloudinary URL cleanup
    if (fileUrl.includes('cloudinary.com')) {
      ensureCloudinaryConfig();
      if (isCloudinaryConfigured()) {
        const parts = fileUrl.split('/');
        const fileWithExt = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${fileWithExt.replace(/\.[^/.]+$/, '')}`;
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
      if (!isDbConnected()) await connectDB();
      await MediaFile.deleteOne({ cloudinaryUrl: fileUrl }).catch(() => {});
      return true;
    }

    // Local / Mongo upload URL cleanup
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
  } catch (err) {
    console.warn('[STORAGE] Non-fatal error cleaning up old file:', err.message);
  }

  return false;
}
