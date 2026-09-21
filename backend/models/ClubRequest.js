import mongoose from 'mongoose';

const clubRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    clubName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    purpose: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    expectedMembers: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminRemarks: { type: String, trim: true },
    reviewedAt: { type: Date },
    createdClubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  },
  { timestamps: true }
);

export default mongoose.models.ClubRequest || mongoose.model('ClubRequest', clubRequestSchema);
