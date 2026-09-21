import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
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
    leaveType: {
      type: String,
      enum: ['casual', 'medical', 'personal', 'emergency', 'family', 'other'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    documentUrl: { type: String }, // Cloudinary URL
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

leaveSchema.index({ studentId: 1, status: 1 });

export default mongoose.models.LeaveApplication ||
  mongoose.model('LeaveApplication', leaveSchema);
