import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns a serverless-safe writable upload directory.
 * On Vercel / AWS Lambda (/var/task is read-only), uses os.tmpdir().
 * On local development, uses backend/uploads if writable, or falls back to os.tmpdir().
 */
export function getUploadDir() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'campushub-uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }

  const localDir = path.resolve(__dirname, '../uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'campushub-uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }
}

/**
 * Public URL stored in MongoDB for uploaded files.
 * Returns the permanent Cloudinary CDN URL or persistent /uploads/:filename path.
 */
export function publicUploadUrl(file) {
  if (!file) return null;
  if (file.url) return file.url;
  if (file.filename) return `/uploads/${file.filename}`;
  return null;
}

/**
 * Validates and sanitizes stored file URLs.
 * Accepts persistent app upload paths, Cloudinary CDN URLs, and safe image data URIs.
 */
export function sanitizeStoredFileUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return null;

  // Relative upload path (e.g. /uploads/file-123.jpg or /api/upload/file/file-123.jpg)
  if (trimmed.startsWith('/uploads/')) {
    const filename = trimmed.slice('/uploads/'.length);
    if (/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return `/uploads/${filename}`;
    }
  }

  if (trimmed.startsWith('/api/upload/file/')) {
    const filename = trimmed.slice('/api/upload/file/'.length);
    if (/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return `/uploads/${filename}`;
    }
  }

  // Absolute URL pointing to /uploads/ or trusted Cloudinary
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      const filename = parsed.pathname.slice('/uploads/'.length);
      if (/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return `/uploads/${filename}`;
      }
    }
    if (parsed.pathname.startsWith('/api/upload/file/')) {
      const filename = parsed.pathname.slice('/api/upload/file/'.length);
      if (/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return `/uploads/${filename}`;
      }
    }
    if (parsed.hostname.endsWith('cloudinary.com') && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
      return trimmed;
    }
  } catch {
    // Not a valid absolute URL, fall through
  }

  // Safe Base64 Image Data URI
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    if (trimmed.length <= 7 * 1024 * 1024) { // ~5MB raw
      return trimmed;
    }
  }

  return null;
}

export function isMockUserId(id) {
  return typeof id === 'string' && id.startsWith('mock_');
}

