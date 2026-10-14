import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { fileUpload } from './upload.js';
import {
  applyLeave, getMyLeave, cancelLeave,
  getMenteeLeave, reviewLeave,
  applyOD, getMyOD,
  getMenteeOD, reviewOD,
} from '../controllers/leaveController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Leave ───────────────────────────────────────────────────────
router.post('/leave', requireRole('student'), fileUpload, applyLeave);
router.get('/leave', requireRole('student'), getMyLeave);
router.patch('/leave/:id/cancel', requireRole('student'), cancelLeave);

// Mentor / Approver: review leave from assigned students
router.get('/leave/mentee', requireRole('mentor', 'admin'), getMenteeLeave);
router.patch('/leave/:id/review', requireRole('mentor', 'admin'), reviewLeave);

// ─── OD ──────────────────────────────────────────────────────────
router.post('/od', requireRole('student'), fileUpload, applyOD);
router.get('/od', requireRole('student'), getMyOD);

// Mentor / Approver: review OD from assigned students
router.get('/od/mentee', requireRole('mentor', 'admin'), getMenteeOD);
router.patch('/od/:id/review', requireRole('mentor', 'admin'), reviewOD);

export default router;
