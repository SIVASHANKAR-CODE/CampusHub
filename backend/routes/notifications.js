import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Notification from '../models/Notification.js';
import {
  getDemoNotificationsForUser,
  markDemoNotificationRead,
  dismissDemoNotification,
  markAllDemoNotificationsRead,
} from '../services/demoStore.js';

const router = Router();
router.use(authenticate);

// Get own notifications
router.get('/', async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const demoNotifications = getDemoNotificationsForUser(req.user.id, req.user.role);
      return res.json({
        success: true,
        message: 'Notifications fetched (Demo Mode).',
        data: {
          notifications: demoNotifications,
          total: demoNotifications.length,
          unread: demoNotifications.filter((item) => !item.read).length,
          page: 1,
          pages: 1,
        },
      });
    }

    await connectDB();
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const roleFilter = req.user.role === 'driver'
      ? { userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] } }
      : req.user.role === 'maintenance'
        ? { userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] } }
      : { userId: req.user.id };

    const [notifications, total, unread] = await Promise.all([
      Notification.find(roleFilter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Notification.countDocuments(roleFilter),
      Notification.countDocuments({ ...roleFilter, read: false }),
    ]);

    res.json({ success: true, message: 'Notifications fetched.', data: { notifications, total, unread, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Mark one as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const notification = markDemoNotificationRead(req.user.id, req.params.id);
      const all = getDemoNotificationsForUser(req.user.id, req.user.role);
      return res.json({
        success: true,
        message: 'Notification marked as read (Demo Mode).',
        data: { updatedCount: notification ? 1 : 0, unreadCount: all.filter((item) => !item.read).length },
      });
    }

    await connectDB();
    const roleFilter = req.user.role === 'driver'
      ? { _id: req.params.id, userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] }, read: false }
      : req.user.role === 'maintenance'
        ? { _id: req.params.id, userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] }, read: false }
      : { _id: req.params.id, userId: req.user.id, read: false };

    const result = await Notification.updateOne(roleFilter, { read: true });
    const unreadFilter = req.user.role === 'driver'
      ? { userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] }, read: false }
      : req.user.role === 'maintenance'
        ? { userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] }, read: false }
      : { userId: req.user.id, read: false };

    res.json({ success: true, message: 'Notification marked as read.', data: { updatedCount: result.modifiedCount, unreadCount: await Notification.countDocuments(unreadFilter) } });
  } catch (err) { next(err); }
});

// Dismiss/delete a notification for the current user
router.delete('/:id', async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const deleted = dismissDemoNotification(req.user.id, req.params.id);
      const all = getDemoNotificationsForUser(req.user.id, req.user.role);
      return res.json({
        success: true,
        message: 'Notification dismissed (Demo Mode).',
        data: { deleted, unreadCount: all.filter((item) => !item.read).length },
      });
    }

    await connectDB();
    const notificationFilter = req.user.role === 'driver'
      ? { _id: req.params.id, userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] } }
      : req.user.role === 'maintenance'
        ? { _id: req.params.id, userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] } }
      : { _id: req.params.id, userId: req.user.id };

    const notification = await Notification.findOneAndDelete(notificationFilter).lean();
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const unreadFilter = req.user.role === 'driver'
      ? { userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] }, read: false }
      : req.user.role === 'maintenance'
        ? { userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] }, read: false }
      : { userId: req.user.id, read: false };

    const unreadCount = await Notification.countDocuments(unreadFilter);
    res.json({ success: true, message: 'Notification dismissed.', data: { deleted: true, unreadCount } });
  } catch (err) { next(err); }
});

// Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      markAllDemoNotificationsRead(req.user.id);
      return res.json({ success: true, message: 'All notifications marked as read (Demo Mode).', data: { updatedCount: 1, unreadCount: 0 } });
    }

    await connectDB();
    const roleFilter = req.user.role === 'driver'
      ? { userId: req.user.id, targetRole: 'driver', category: { $in: ['transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'emergency'] }, read: false }
      : req.user.role === 'maintenance'
        ? { userId: req.user.id, targetRole: 'maintenance', category: { $in: ['maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency'] }, read: false }
      : { userId: req.user.id, read: false };

    const result = await Notification.updateMany(roleFilter, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.', data: { updatedCount: result.modifiedCount, unreadCount: 0 } });
  } catch (err) { next(err); }
});

export default router;
