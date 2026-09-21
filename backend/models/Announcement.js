import mongoose from 'mongoose';

const audienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['everyone', 'department', 'year', 'section', 'faculty', 'hostellers', 'day_scholars', 'specific_role'],
      default: 'everyone',
    },
    department: { type: String },
    year: { type: Number },
    section: { type: String },
    role: { type: String },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    body: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'academic',
        'exam',
        'fee',
        'transport',
        'hostel',
        'event',
        'holiday',
        'emergency',
        'general',
        'placement',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    audience: audienceSchema,
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date },
    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

announcementSchema.index({ publishedAt: -1, isPublished: 1 });
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.models.Announcement ||
  mongoose.model('Announcement', announcementSchema);
