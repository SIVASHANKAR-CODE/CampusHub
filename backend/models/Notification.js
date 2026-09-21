import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'important', 'emergency'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['academic', 'exam', 'fees', 'attendance', 'transport', 'trip', 'route', 'bus', 'driver', 'pickup', 'location', 'maintenance', 'complaint', 'task', 'facility', 'equipment', 'repair', 'work_order', 'emergency', 'system', 'general'],
      default: 'general',
      index: true,
    },
    targetRole: {
      type: String,
      enum: ['student', 'driver', 'faculty', 'mentor', 'admin', 'maintenance', 'transport_staff', 'security', 'club_president', 'all'],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String, trim: true }, // Frontend route e.g. "/student/leaves/123"
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Reference to the related resource
    relatedModel: { type: String, trim: true }, // e.g. "LeaveApplication"
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, targetRole: 1, category: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
