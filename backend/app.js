import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getAIConfigStatus } from './services/aiService.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leave.js';
import complaintRoutes from './routes/complaints.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import feesRoutes from './routes/fees.js';
import examsRoutes from './routes/exams.js';
import timetableRoutes from './routes/timetable.js';
import hostelRoutes from './routes/hostel.js';
import transportRoutes from './routes/transport.js';
import clubsRoutes from './routes/clubs.js';
import eventsRoutes from './routes/events.js';
import announcementsRoutes from './routes/announcements.js';
import libraryRoutes from './routes/library.js';
import questionPapersRoutes from './routes/questionPapers.js';
import lostFoundRoutes from './routes/lostFound.js';
import locationsRoutes from './routes/locations.js';
import notificationsRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

const app = express();

// ─── Security headers ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Configured separately for PWA
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5175',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://campushub.vercel.app',
  /\.vercel\.app$/,
];

// Private IPv4 ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x, localhost, 127.0.0.1) on any port
const LAN_OR_LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server or same-origin
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && LAN_OR_LOCAL_ORIGIN_REGEX.test(origin)) {
      return callback(null, true);
    }
    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(allowed ? null : new Error('CORS not allowed'), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Rate limiting ────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Static files ────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Root redirect to frontend ────────────────────────────────────
app.get('/', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  if (req.accepts('html')) {
    return res.redirect(frontendUrl);
  }
  res.json({ success: true, message: 'CampusHub API is running.', frontendUrl });
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const aiStatus = getAIConfigStatus();

  if (req.accepts('html') && !req.xhr && !req.query.json && req.headers['sec-fetch-dest'] === 'document') {
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusHub API Status</title>
  <meta http-equiv="refresh" content="2;url=${frontendUrl}" />
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; padding: 4px 14px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; font-size: 24px; font-weight: 700; color: #fff; }
    p { margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; transition: background 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .btn:hover { background: #2563eb; }
    .subtext { margin-top: 18px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● Backend API Active & Online</div>
    <h1>CampusHub API is Running</h1>
    <p>You opened the backend API endpoint. The full CampusHub PWA application interface is running on port 5173.</p>
    <a href="${frontendUrl}" class="btn">Open CampusHub Application ➔</a>
    <div class="subtext">Redirecting you to ${frontendUrl} in 2 seconds...</div>
  </div>
</body>
</html>`);
  }
  res.json({
    success: true,
    message: 'CampusHub API is running.',
    timestamp: new Date().toISOString(),
    ai: {
      provider: aiStatus.provider,
      configured: aiStatus.configured,
      model: aiStatus.model,
    },
  });
});

app.get('/api/health/ai', (req, res) => {
  const aiStatus = getAIConfigStatus();
  res.json({
    success: true,
    data: {
      provider: aiStatus.provider,
      configured: aiStatus.configured,
      model: aiStatus.model,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api', leaveRoutes);          // /api/leave  + /api/od
app.use('/api/complaints', complaintRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/question-papers', questionPapersRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// ─── 404 ──────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ─── Central error handler ────────────────────────────────────────
app.use(errorHandler);

// IMPORTANT: No app.listen() — Vercel calls this as a function handler
export default app;
