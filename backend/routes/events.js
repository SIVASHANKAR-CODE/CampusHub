import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import CampusEvent from '../models/CampusEvent.js';
import Student from '../models/Student.js';
import { getDemoEvents, addDemoEvent, publishDemoEvent, registerDemoEvent } from '../services/demoStore.js';

const router = Router();

// ─── List events ─────────────────────────────────────────────────────────────
// Admin sees ALL events (drafts + published); Students see only published upcoming events
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    const isAdmin = req.user?.role === 'admin';

    if (isMock || !isDbConnected()) {
      const demoList = getDemoEvents({ isAdmin, category });
      const events = demoList.map((event) => {
        const regList = event.registrations || [];
        const isRegistered = regList.includes(req.user.id);
        return {
          ...event,
          registrationCount: regList.length,
          isRegistered,
        };
      });

      return res.json({
        success: true,
        message: 'Events fetched (Demo Mode).',
        data: {
          events,
          total: events.length,
          page: Number(page),
          pages: Math.ceil(events.length / Number(limit)) || 1,
        },
      });
    }

    await connectDB();
    const filter = {};
    if (category) filter.category = category;

    // Students only see published events
    if (!isAdmin) {
      filter.isPublished = true;
      // Show events from yesterday onwards
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filter.date = { $gte: yesterday };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      CampusEvent.find(filter).sort({ date: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      CampusEvent.countDocuments(filter),
    ]);

    let studentId = null;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id }).select('_id').lean();
      studentId = student?._id;
    }

    const mappedEvents = events.map((event) => {
      const regList = event.registrations || [];
      const isRegistered = Boolean(studentId && regList.some((id) => String(id) === String(studentId)));
      return {
        ...event,
        registrationCount: regList.length,
        isRegistered,
      };
    });

    res.json({
      success: true,
      message: 'Events fetched.',
      data: {
        events: mappedEvents,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1,
      },
    });
  } catch (err) { next(err); }
});

// ─── Student: register for event ─────────────────────────────────────────────
router.post('/:id/register', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || String(req.params.id).startsWith('demo-event-') || !isDbConnected()) {
      const result = registerDemoEvent(req.params.id, req.user.id);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.json({
        success: true,
        message: 'Registered for event successfully (Demo Mode).',
        data: { isRegistered: true, registrationCount: result.count },
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const event = await CampusEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (event.maxCapacity && event.registrations?.length >= event.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity.' });
    }

    const result = await CampusEvent.updateOne(
      {
        _id: event._id,
        registrations: { $ne: student._id },
        ...(event.maxCapacity ? { $expr: { $lt: [{ $size: '$registrations' }, event.maxCapacity] } } : {}),
      },
      { $addToSet: { registrations: student._id } }
    );

    if (!result.modifiedCount) {
      return res.status(400).json({ success: false, message: 'Already registered for this event or event is full.' });
    }

    const updatedEvent = await CampusEvent.findById(event._id).select('registrations').lean();
    res.json({
      success: true,
      message: 'Registered for event successfully.',
      data: { isRegistered: true, registrationCount: updatedEvent?.registrations?.length || 0 },
    });
  } catch (err) { next(err); }
});

// ─── Admin/Club President: create event ──────────────────────────────────────
router.post('/', authenticate, requireRole('admin', 'club_president'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    const normCategory = String(req.body.category || 'other').toLowerCase();
    const payload = {
      ...req.body,
      category: normCategory,
      isPublished: req.body.isPublished ?? false,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
      maxCapacity: req.body.maxCapacity ? Number(req.body.maxCapacity) : undefined,
    };

    if (isMock || !isDbConnected()) {
      const created = addDemoEvent(payload);
      return res.status(201).json({ success: true, message: 'Event created (Demo Mode).', data: created });
    }

    await connectDB();
    const event = await CampusEvent.create({ ...payload, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (err) { next(err); }
});

// ─── Admin: publish event ────────────────────────────────────────────────────
router.patch('/:id/publish', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || String(req.params.id).startsWith('demo-event-') || !isDbConnected()) {
      const published = publishDemoEvent(req.params.id);
      if (!published) return res.status(404).json({ success: false, message: 'Event not found.' });
      return res.json({ success: true, message: 'Event published successfully (Demo Mode).', data: published });
    }

    await connectDB();
    const event = await CampusEvent.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event published.', data: event });
  } catch (err) { next(err); }
});

// ─── Admin: update event ─────────────────────────────────────────────────────
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || String(req.params.id).startsWith('demo-event-') || !isDbConnected()) {
      return res.json({ success: true, message: 'Event updated (Demo Mode).' });
    }

    await connectDB();
    const event = await CampusEvent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Event updated.', data: event });
  } catch (err) { next(err); }
});

export default router;
