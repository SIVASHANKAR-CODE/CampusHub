import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
const isDev = process.env.NODE_ENV !== 'production';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDev ? 2000 : 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
  skip: (req) => {
    // Never rate-limit in development, or on public endpoints
    if (isDev) return true;
    if (req.method === 'GET' && req.path.startsWith('/api/public')) return true;
    return false;
  },
});

/**
 * Strict rate limiter for authentication endpoints (brute-force protection)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || (isDev ? 200 : 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  skipSuccessfulRequests: true,
  skip: () => isDev, // Skip entirely in development
});

/**
 * Rate limiter for AI chat (more generous but still protected)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages. Please wait a moment before sending another.',
  },
});
