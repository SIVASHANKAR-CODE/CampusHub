import jwt from 'jsonwebtoken';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Mentor from '../models/Mentor.js';
import { verifyPassword } from '../services/passwordService.js';
import { createAuditLog } from '../services/auditService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const DEMO_PRESET_USERS = {
  'maintenance@demo.com': {
    id: 'mock_maint_001',
    role: 'maintenance',
    email: 'maintenance@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Suresh Kumar', role: 'maintenance', phone: '+91 98765 00005' },
  },
  'student@demo.com': {
    id: 'mock_student_001',
    role: 'student',
    email: 'student@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Aarav Patel', department: 'CSE', year: 2, semester: 3, section: 'A', regNo: 'DEMO001' },
  },
  'faculty@demo.com': {
    id: 'mock_faculty_001',
    role: 'faculty',
    email: 'faculty@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Dr. Rajesh Sharma', department: 'CSE', designation: 'Associate Professor', employeeId: 'DEMOFAC1' },
  },
  'mentor@demo.com': {
    id: 'mock_mentor_001',
    role: 'mentor',
    email: 'mentor@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Dr. Priya Raman', department: 'CSE', employeeId: 'DEMOMEN1' },
  },
  'admin@demo.com': {
    id: 'mock_admin_001',
    role: 'admin',
    email: 'admin@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Campus Administrator', role: 'admin' },
  },
  'driver@demo.com': {
    id: 'mock_driver_001',
    role: 'driver',
    email: 'driver@demo.com',
    password: 'Demo@2026',
    profile: { name: 'Ramesh Chandran', role: 'driver', phone: '+91 94444 55555' },
  },
  'admin@campushub.edu': {
    id: 'mock_admin_002',
    role: 'admin',
    email: 'admin@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Campus Administrator', role: 'admin' },
  },
  'student@campushub.edu': {
    id: 'mock_student_002',
    role: 'student',
    email: 'student@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Aarav Patel', department: 'CSE', year: 2, semester: 3, section: 'A', regNo: '21CS001' },
  },
  'faculty@campushub.edu': {
    id: 'mock_faculty_002',
    role: 'faculty',
    email: 'faculty@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Dr. Rajesh Sharma', department: 'CSE', designation: 'Associate Professor' },
  },
  'mentor@campushub.edu': {
    id: 'mock_mentor_002',
    role: 'mentor',
    email: 'mentor@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Dr. Priya Raman', department: 'CSE', employeeId: 'MEN001' },
  },
  'maintenance@campushub.edu': {
    id: 'mock_maint_002',
    role: 'maintenance',
    email: 'maintenance@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Suresh Kumar', role: 'maintenance', phone: '+91 98765 00005' },
  },
  'driver@campushub.edu': {
    id: 'mock_driver_002',
    role: 'driver',
    email: 'driver@campushub.edu',
    password: 'Password@123',
    profile: { name: 'Ramesh Chandran', role: 'driver', phone: '+91 94444 55555' },
  },
};

function issueToken(userId, role) {
  const secret = process.env.JWT_SECRET || 'campushub_fallback_jwt_secret_key_32chars!';
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normEmail = email.toLowerCase().trim();
    const isDemoAccount = !!DEMO_PRESET_USERS[normEmail];

    // Fast-path: If database is not currently connected and this is a preset demo account,
    // authenticate immediately in <1ms without blocking on an offline DB connection attempt!
    if (isDemoAccount && !isDbConnected()) {
      const demoUser = DEMO_PRESET_USERS[normEmail];
      if (password !== demoUser.password) {
        return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
      }
      const token = issueToken(demoUser.id, demoUser.role);
      res.cookie('token', token, COOKIE_OPTIONS);
      return res.json({
        success: true,
        message: 'Logged in successfully (Instant Demo).',
        data: {
          token,
          user: { id: demoUser.id, email: demoUser.email, role: demoUser.role },
          profile: demoUser.profile,
        },
      });
    }

    // Check if MongoDB is connected; if not, try to connect
    let dbConnected = true;
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('[AUTH] MongoDB not connected:', dbErr.message);
      dbConnected = false;
    }

    // If MongoDB is offline, gracefully authenticate demo accounts
    if (!dbConnected) {
      const demoUser = DEMO_PRESET_USERS[normEmail];
      if (demoUser) {
        if (password !== demoUser.password) {
          return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
        }
        const token = issueToken(demoUser.id, demoUser.role);
        res.cookie('token', token, COOKIE_OPTIONS);
        return res.json({
          success: true,
          message: 'Logged in successfully.',
          data: {
            token,
            user: { id: demoUser.id, email: demoUser.email, role: demoUser.role },
            profile: demoUser.profile,
          },
        });
      }

      return res.status(503).json({
        success: false,
        message: 'MongoDB is offline. Please configure MONGODB_URI in your .env file or use one of the demo accounts.',
      });
    }

    // Always include passwordHash in this query
    const user = await User.findOne({ email: normEmail }).select('+passwordHash');
    if (!user) {
      // Also check demo accounts if DB doesn't have the user yet
      const demoUser = DEMO_PRESET_USERS[normEmail];
      if (demoUser && password === demoUser.password) {
        const token = issueToken(demoUser.id, demoUser.role);
        res.cookie('token', token, COOKIE_OPTIONS);
        return res.json({
          success: true,
          message: 'Logged in successfully.',
          data: {
            token,
            user: { id: demoUser.id, email: demoUser.email, role: demoUser.role },
            profile: demoUser.profile,
          },
        });
      }
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    // Account locked?
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed attempts. Try again later.',
      });
    }

    // Verify password
    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    // Success — reset failed attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Build profile data for the frontend
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id }).select('-__v');
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ userId: user._id }).select('-__v');
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ userId: user._id }).select('-__v');
    }

    const token = issueToken(user._id, user.role);
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * GET /api/auth/me
 * Returns current authenticated user without sensitive data
 */
export async function getMe(req, res, next) {
  try {
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      const demoUser = Object.values(DEMO_PRESET_USERS).find((u) => u.id === req.user.id);
      return res.json({
        success: true,
        message: 'Profile fetched successfully.',
        data: {
          user: { id: req.user.id, email: req.user.email, role: req.user.role },
          profile: demoUser?.profile || null,
        },
      });
    }

    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('[AUTH] DB offline during getMe:', dbErr.message);
      return res.status(503).json({ success: false, message: 'Database offline.' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash -loginAttempts -lockUntil');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id }).select('-__v');
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ userId: user._id }).select('-__v');
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ userId: user._id }).select('-__v');
    }

    res.json({
      success: true,
      message: 'Profile fetched successfully.',
      data: {
        user: { id: user._id, email: user.email, role: user.role, lastLogin: user.lastLogin },
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
}
