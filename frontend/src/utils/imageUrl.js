/**
 * Resolves an uploaded file URL for browser display.
 * - Leaves absolute HTTPS URLs (e.g. Cloudinary CDN) untouched.
 * - Normalizes local/relative upload paths (/uploads/... or /api/uploads/...).
 * - Avoids double prefixing of API or origin URLs.
 */
export function resolveFileUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Already an absolute URL, data URI, or blob URI
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Check if frontend is configured with a distinct external API origin
  const apiUrl = import.meta.env?.VITE_API_URL;
  if (apiUrl && typeof apiUrl === 'string' && apiUrl.startsWith('http')) {
    try {
      const base = new URL(apiUrl);
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${base.origin}${cleanPath}`;
    } catch {
      // Fall through to relative path
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Checks if a stored URL is an absolute HTTPS cloud asset (such as Cloudinary).
 */
export function isCloudAsset(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('https://') && url.includes('cloudinary.com');
}
