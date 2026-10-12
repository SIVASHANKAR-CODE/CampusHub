import Notification from '../models/Notification.js';
import { isDbConnected } from '../config/db.js';
import { addDemoNotification } from './demoStore.js';
import mongoose from 'mongoose';

/**
 * Create a notification for one or more users.
 * Dispatches to demoStore for demo users or when offline,
 * and saves to MongoDB for real accounts.
 *
 * @param {object|object[]} payload - Single notification or array
 */
export async function createNotification(payload) {
  try {
    const list = Array.isArray(payload) ? payload : [payload];
    const demoItems = [];
    const dbItems = [];

    for (const item of list) {
      const idStr = String(item.userId || '');
      if (idStr.startsWith('mock_') || !isDbConnected() || !mongoose.isValidObjectId(idStr)) {
        demoItems.push(item);
      } else {
        dbItems.push(item);
      }
    }

    if (demoItems.length > 0) {
      addDemoNotification(demoItems);
    }

    if (dbItems.length > 0 && isDbConnected()) {
      if (dbItems.length === 1) {
        await Notification.create(dbItems[0]);
      } else {
        await Notification.insertMany(dbItems);
      }
    }
  } catch (err) {
    // Notifications must never crash main request
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId) {
  if (String(userId).startsWith('mock_') || !isDbConnected()) {
    return 0;
  }
  return Notification.countDocuments({ userId, read: false });
}
