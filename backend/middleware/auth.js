import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

// Fast in-memory cache for authenticated users (reduces redundant DB queries)
const userAuthCache = new Map();

export function clearUserAuthCache(userId) {
  if (userId) {
    userAuthCache.delete(userId);
  } else {
    userAuthCache.clear();
  }
}

/**
 * Verifies JWT from Authorization header (Bearer token) or httpOnly cookie.
 * Attaches req.user = { id, role, email } on success.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // 2. Fall back to httpOnly cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    // Verify token
    let decoded;
    try {
      const secret = process.env.JWT_SECRET || 'campushub_fallback_jwt_secret_key_32chars!';
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }

    // Bypass DB lookup for mock demo users
    if (typeof decoded.id === 'string' && decoded.id.startsWith('mock_')) {
      req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
      return next();
    }

    // Fast-path: In-memory cache check (60-second TTL)
    const now = Date.now();
    const cachedEntry = userAuthCache.get(decoded.id);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      req.user = cachedEntry.user;
      return next();
    }

    // Load user from DB (verifies account still active)
    await connectDB();
    const user = await User.findById(decoded.id).select('_id email role isActive lockUntil').lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled. Contact your administrator.' });
    }
    if (user.lockUntil && user.lockUntil > now) {
      return res.status(423).json({ success: false, message: 'Account is temporarily locked due to failed login attempts.' });
    }

    const userData = { id: user._id.toString(), role: user.role, email: user.email };
    userAuthCache.set(decoded.id, { user: userData, expiresAt: now + 60000 });
    req.user = userData;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Unable to verify authentication. Please try again.' });
  }
}

/**
 * Role-based access control.
 * Usage: requireRole('admin', 'faculty')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

/**
 * Ensures the requesting student can only access their own data.
 * Call after authenticate() and after resolving the target studentId.
 */
export function requireSelfOrAdmin(req, res, next) {
  const { id, role } = req.user;
  const targetId = req.params.studentId || req.params.id;

  if (role === 'admin') return next();

  if (role === 'student' && id !== targetId) {
    return res.status(403).json({ success: false, message: 'You can only access your own information.' });
  }

  next();
}
