import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { complaintImageUpload } from './upload.js';
import {
  createComplaint, getMyComplaints, acknowledgeComplaint,
  getAllComplaints, updateComplaintStatus,
  getAssignedComplaints, updateComplaintProgress, getComplaintById,
  claimComplaint, addComplaintComment,
} from '../controllers/complaintController.js';

const router = Router();
router.use(authenticate);

// Student
router.post('/', requireRole('student'), complaintImageUpload, createComplaint);
router.get('/my', requireRole('student'), getMyComplaints);
router.patch('/:id/acknowledge', requireRole('student'), acknowledgeComplaint);

// Admin
router.get('/', requireRole('admin'), getAllComplaints);
router.patch('/:id/status', requireRole('admin'), updateComplaintStatus);

// Maintenance
router.get('/assigned', requireRole('maintenance'), getAssignedComplaints);
router.patch('/:id/progress', requireRole('maintenance'), complaintImageUpload, updateComplaintProgress);
router.patch('/:id/claim', requireRole('maintenance'), claimComplaint);

// Complaint detail and authorized updates
router.get('/:id', requireRole('student', 'admin', 'maintenance'), getComplaintById);
router.post('/:id/comments', requireRole('admin', 'maintenance'), addComplaintComment);

export default router;
