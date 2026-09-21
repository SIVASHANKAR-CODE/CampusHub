import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import LostAndFound from '../models/LostAndFound.js';
import Student from '../models/Student.js';

const router = Router();

const DEMO_POSTS = [
  { _id: 'demo-lost-wallet', type: 'lost', itemName: 'Black wallet', description: 'Black leather wallet with a college ID and two bank cards.', location: 'Central Library, second floor', date: new Date(Date.now() - 2 * 86400000), contactMethod: 'CampusHub messages', status: 'active', postedBy: { name: 'Aarav Patel', regNo: '21CS001' } },
  { _id: 'demo-found-id', type: 'found', itemName: 'Student ID card', description: 'CSE student ID card found near the main auditorium.', location: 'Main Auditorium entrance', date: new Date(Date.now() - 86400000), contactMethod: 'Security desk at the main gate', status: 'active', postedBy: { name: 'Priya Nair', regNo: '21CS002' } },
  { _id: 'demo-found-usb', type: 'found', itemName: 'USB drive', description: 'Small blue 32GB USB drive found after the afternoon lab session.', location: 'Block B computer lab', date: new Date(), contactMethod: 'CSE department office', status: 'active', postedBy: { name: 'Rohan Gupta', regNo: '21CS003' } },
];

// All: list posts
router.get('/', async (req, res, next) => {
  try {
    const { type, status = 'active', page = 1, limit = 20 } = req.query;
    if (!isDbConnected()) {
      try { await connectDB(); } catch {
        const posts = DEMO_POSTS.filter((post) => (!type || post.type === type) && post.status === status);
        return res.json({ success: true, message: 'Posts fetched (Demo Mode).', data: { posts, total: posts.length, page: Number(page), pages: Math.ceil(posts.length / Number(limit)) } });
      }
    }

    await connectDB();
    const filter = { status };
    if (type) filter.type = type;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      LostAndFound.find(filter).populate('postedBy', 'name regNo').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      LostAndFound.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Posts fetched.', data: { posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Student: create post
router.post('/', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    const post = await LostAndFound.create({ ...req.body, postedBy: student._id, imageUrl: req.body.imageUrl || null });
    res.status(201).json({ success: true, message: 'Post created.', data: post });
  } catch (err) { next(err); }
});

// Student: mark resolved (own post only)
router.patch('/:id/resolve', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    const post = await LostAndFound.findOne({ _id: req.params.id, postedBy: student._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    post.status = 'resolved';
    post.resolvedAt = new Date();
    await post.save();
    res.json({ success: true, message: 'Post marked as resolved.' });
  } catch (err) { next(err); }
});

// Student: report abuse
router.post('/:id/report', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    await LostAndFound.findByIdAndUpdate(req.params.id, {
      isReported: true, reportReason: req.body.reason, reportedBy: student._id,
    });
    res.json({ success: true, message: 'Post reported. Our team will review it.' });
  } catch (err) { next(err); }
});

// Admin: moderate (remove)
router.patch('/:id/moderate', authenticate, requireRole('admin', 'security'), async (req, res, next) => {
  try {
    await connectDB();
    await LostAndFound.findByIdAndUpdate(req.params.id, { status: 'removed', moderatedBy: req.user.id });
    res.json({ success: true, message: 'Post removed.' });
  } catch (err) { next(err); }
});

export default router;
