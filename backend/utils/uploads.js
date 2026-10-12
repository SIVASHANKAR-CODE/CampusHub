/**
 * Public URL stored in MongoDB for locally uploaded files.
 * Never persist multer's absolute disk path — browsers cannot open it.
 */
export function publicUploadUrl(file) {
  if (!file?.filename) return null;
  return `/uploads/${file.filename}`;
}

/**
 * Only accept app-hosted upload paths and whitelisted cloud providers. Reject arbitrary remote or script URLs.
 */
export function sanitizeStoredFileUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return null;

  // Relative upload path (e.g. /uploads/file-123.jpg)
  if (trimmed.startsWith('/uploads/')) {
    const filename = trimmed.slice('/uploads/'.length);
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
    if (parsed.hostname.endsWith('cloudinary.com') && parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // Not a valid absolute URL, fall through
  }

  return null;
}

export function isMockUserId(id) {
  return typeof id === 'string' && id.startsWith('mock_');
}

