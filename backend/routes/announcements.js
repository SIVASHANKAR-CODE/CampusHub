import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Announcement from '../models/Announcement.js';
import Student from '../models/Student.js';

const router = Router();

const DEMO_ANNOUNCEMENTS = [
  { _id: 'demo-announcement-exams', title: 'Semester Mid-Term Examinations Notification', body: 'The mid-term examination timetable for second and third year students is now available.', category: 'academic', priority: 'high', publishedAt: new Date(), isPinned: true, isPublished: true, audience: { type: 'everyone' } },
  { _id: 'demo-announcement-fee', title: 'Semester Fee Payment Reminder', body: 'Pay Semester 3 tuition fees before the announced due date to avoid late penalties.', category: 'fee', priority: 'high', publishedAt: new Date(Date.now() - 86400000), isPinned: false, isPublished: true, audience: { type: 'everyone' } },
  { _id: 'demo-announcement-placement', title: 'Placement Workshop This Friday', body: 'Join the placement preparation workshop at 3:00 PM in the main auditorium.', category: 'placement', priority: 'normal', publishedAt: new Date(Date.now() - 2 * 86400000), isPinned: false, isPublished: true, audience: { type: 'everyone' } },
];

// Student/Faculty: get relevant announcements (server-side audience filtering)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      const announcements = DEMO_ANNOUNCEMENTS.filter((announcement) => !category || announcement.category === category);
      return res.json({ success: true, message: 'Announcements fetched (Demo Mode).', data: { announcements, total: announcements.length, page: Number(page), pages: Math.ceil(announcements.length / Number(limit)) } });
    }

    if (!isDbConnected()) {
      try { await connectDB(); } catch {
        return res.json({ success: true, message: 'Announcements unavailable while offline.', data: { announcements: [], total: 0, page: Number(page), pages: 0 } });
      }
    }
    await connectDB();
    const now = new Date();
    const filter = { isPublished: true, publishedAt: { $lte: now }, $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] };

    // For students, filter by audience
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id }).lean();
      if (student) {
        filter.$or = [
          { 'audience.type': 'everyone' },
          { 'audience.type': 'department', 'audience.department': student.department },
          { 'audience.type': 'year', 'audience.year': student.year },
          { 'audience.type': 'section', 'audience.section': student.section },
          ...(student.hostelStatus === 'hosteller' ? [{ 'audience.type': 'hostellers' }] : []),
          ...(student.hostelStatus === 'day_scholar' ? [{ 'audience.type': 'day_scholars' }] : []),
        ];
      }
    }

    if (category) filter.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(filter).sort({ isPinned: -1, priority: -1, publishedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Announcement.countDocuments(filter),
    ]);

    res.json({ success: true, message: 'Announcements fetched.', data: { announcements, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Admin: create announcement
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const ann = await Announcement.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Announcement published.', data: ann });
  } catch (err) { next(err); }
});

// Admin: update/delete
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Announcement updated.', data: ann });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    await Announcement.findByIdAndUpdate(req.params.id, { isPublished: false });
    res.json({ success: true, message: 'Announcement removed.' });
  } catch (err) { next(err); }
});

export default router;
