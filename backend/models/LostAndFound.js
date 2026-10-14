import mongoose from 'mongoose';

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
      index: true,
    },
    itemName: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    contactMethod: { type: String, trim: true }, // "Call 98XXXXXXXX" or "See in Room X"
    status: {
      type: String,
      enum: ['active', 'resolved', 'expired', 'removed'],
      default: 'active',
      index: true,
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

lostFoundSchema.index({ createdAt: -1, status: 1 });

export default mongoose.models.LostAndFound || mongoose.model('LostAndFound', lostFoundSchema);
