import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Complaint from '../models/Complaint.js';
import Attendance from '../models/Attendance.js';
import CampusEvent from '../models/CampusEvent.js';
import LeaveApplication from '../models/LeaveApplication.js';
import ODApplication from '../models/ODApplication.js';
import TransportBus from '../models/TransportBus.js';
import Club from '../models/Club.js';
import LibraryBook from '../models/LibraryBook.js';
import Exam from '../models/Exam.js';
import AuditLog from '../models/AuditLog.js';
import AIKnowledgeBase from '../models/AIKnowledgeBase.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

// Admin Dashboard Stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser) {
      return res.json({
        success: true,
        message: 'Admin dashboard data loaded (Demo Mode).',
        data: {
          students: { total: 1240, hostellers: 680, dayScholars: 560, lowAttendance: 14 },
          totalStudents: 1240,
          hostellers: 680,
          dayScholars: 560,
          totalFaculty: 85,
          faculty: 85,
          complaints: { pending: 4, active: 7 },
          pendingComplaints: 4,
          activeComplaints: 7,
          applications: { leave: 3, od: 2 },
          pendingLeave: 3,
          pendingOD: 2,
          upcoming: { exams: 4, events: 2 },
          upcomingExams: 4,
          upcomingEvents: 2,
          transport: { activeBuses: 12 },
          activeBuses: 12,
          community: { clubs: 8 },
          totalClubs: 8,
          library: { books: 15420 },
          totalBooks: 15420,
          lowAttendanceCount: 14,
        },
      });
    }

    await connectDB();
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents, totalFaculty, hostellers, dayScholars,
      pendingComplaints, activeComplaints, pendingLeave, pendingOD,
      upcomingExams, upcomingEvents, activeBuses, totalClubs, totalBooks,
      lowAttendanceCount,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Faculty.countDocuments({ isActive: true }),
      Student.countDocuments({ hostelStatus: 'hosteller', isActive: true }),
      Student.countDocuments({ hostelStatus: 'day_scholar', isActive: true }),
      Complaint.countDocuments({ status: 'submitted' }),
      Complaint.countDocuments({ status: { $in: ['under_review', 'assigned', 'in_progress'] } }),
      LeaveApplication.countDocuments({ status: 'pending' }),
      ODApplication.countDocuments({ status: 'pending' }),
      Exam.countDocuments({ isPublished: true, date: { $gte: today, $lte: in7Days } }),
      CampusEvent.countDocuments({ isPublished: true, date: { $gte: today, $lte: in7Days } }),
      TransportBus.countDocuments({ status: { $in: ['active', 'on_trip'] } }),
      Club.countDocuments({ isActive: true }),
      LibraryBook.countDocuments({ isActive: true }),
      // Low attendance students (rough count — those with < 80% in any subject)
      Attendance.distinct('studentId', {}).then(async (ids) => {
        // Simplified: count students who have any subject below threshold
        return 0; // Full aggregate done on demand
      }),
    ]);

    res.json({
      success: true,
      message: 'Admin dashboard data loaded.',
      data: {
        students: { total: totalStudents, hostellers, dayScholars },
        faculty: totalFaculty,
        complaints: { pending: pendingComplaints, active: activeComplaints },
        applications: { leave: pendingLeave, od: pendingOD },
        upcoming: { exams: upcomingExams, events: upcomingEvents },
        transport: { activeBuses },
        community: { clubs: totalClubs },
        library: { books: totalBooks },
      },
    });
  } catch (err) { next(err); }
});

// Audit logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    await connectDB();
    const { page = 1, limit = 50, action } = req.query;
    const filter = action ? { action } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Audit logs fetched.', data: { logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// AI Knowledge Base management
router.get('/knowledge', async (req, res, next) => {
  try {
    await connectDB();
    const items = await AIKnowledgeBase.find().sort({ category: 1 }).lean();
    res.json({ success: true, message: 'Knowledge base fetched.', data: items });
  } catch (err) { next(err); }
});

router.post('/knowledge', async (req, res, next) => {
  try {
    await connectDB();
    const item = await AIKnowledgeBase.create({ ...req.body, lastUpdatedBy: req.user.id });
    res.status(201).json({ success: true, message: 'Knowledge base entry added.', data: item });
  } catch (err) { next(err); }
});

router.patch('/knowledge/:id', async (req, res, next) => {
  try {
    await connectDB();
    const item = await AIKnowledgeBase.findByIdAndUpdate(req.params.id, { ...req.body, lastUpdatedBy: req.user.id }, { new: true });
    res.json({ success: true, message: 'Knowledge base entry updated.', data: item });
  } catch (err) { next(err); }
});

router.delete('/knowledge/:id', async (req, res, next) => {
  try {
    await connectDB();
    await AIKnowledgeBase.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Entry removed.' });
  } catch (err) { next(err); }
});

export default router;
