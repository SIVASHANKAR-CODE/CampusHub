import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, trim: true },
    updatedByRole: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    }, // e.g. CMP-2026-00124 — generated before save
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['academic', 'hostel', 'transport', 'facilities', 'infrastructure', 'maintenance', 'food', 'library', 'administration', 'electrical', 'plumbing', 'it', 'other'],
      required: true,
      index: true,
    },
    subCategory: { type: String, trim: true }, // e.g. "Wi-Fi", "Food", etc.
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    resolutionImageUrl: { type: String },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'assigned',
        'in_progress',
        'resolved',
        'rejected',
        'closed',
      ],
      default: 'submitted',
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String, trim: true },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    resolutionNote: { type: String, trim: true },
    studentAcknowledged: { type: Boolean, default: false },
    timeline: [timelineSchema],
    comments: [commentSchema],
    isReported: { type: Boolean, default: false }, // abuse report
  },
  { timestamps: true }
);

// Auto-generate ticket ID before save
complaintSchema.pre('save', async function () {
  if (this.isNew && !this.ticketId) {
    const year = new Date().getFullYear();
    const prefix = `CMP-${year}-`;
    const lastComplaint = await this.constructor
      .findOne({ ticketId: new RegExp(`^${prefix}`) })
      .sort({ ticketId: -1 })
      .select('ticketId')
      .lean();

    let seq = 1;
    if (lastComplaint?.ticketId) {
      const match = lastComplaint.ticketId.match(new RegExp(`^${prefix}(\\d+)`));
      if (match) {
        seq = parseInt(match[1], 10) + 1;
      }
    }
    this.ticketId = `${prefix}${String(seq).padStart(5, '0')}`;
  }
});

complaintSchema.index({ studentId: 1, status: 1 });

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
