/**
 * Central error handler for Express.
 * Always returns { success: false, message } — never leaks stack traces.
 */
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }

  if (err.code?.startsWith('GEMINI_') || err.code?.startsWith('AI_') || err.code === 'AI_UNAVAILABLE') {
    return res.status(err.statusCode || 503).json({ success: false, code: err.code, message: err.message });
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'The uploaded file is too large.' });
  }

  // Multer upload validation errors
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The uploaded file exceeds the allowed size limit.'
      : 'The file could not be uploaded.';
    return res.status(400).json({ success: false, code: 'FILE_UPLOAD_FAILED', message });
  }
  if (err.message?.startsWith('Invalid complaint photo.')) {
    return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_IMAGE', message: err.message });
  }
  if (err.message?.startsWith('Invalid file format.')) {
    return res.status(400).json({ success: false, code: 'INVALID_UPLOAD_FILE', message: err.message });
  }
  if (err.message?.startsWith('Invalid question paper.')) {
    return res.status(400).json({ success: false, code: 'INVALID_QUESTION_PAPER_FILE', message: err.message });
  }

  // Default — don't expose internal details
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500
    ? err.message || 'An error occurred.'
    : 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({ success: false, message });
}

/**
 * Helper to create HTTP errors with status codes.
 */
export function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
