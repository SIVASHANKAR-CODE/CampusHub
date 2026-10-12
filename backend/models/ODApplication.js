import mongoose from 'mongoose';

const odSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
      index: true,
    },
    eventName: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    venue: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    documentUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mentorRemarks: { type: String, trim: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

odSchema.index({ studentId: 1, status: 1 });

export default mongoose.models.ODApplication ||
  mongoose.model('ODApplication', odSchema);
