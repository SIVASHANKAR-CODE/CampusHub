import mongoose from 'mongoose';

const knowledgeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'library',
        'office',
        'facilities',
        'procedures',
        'academics',
        'transport',
        'hostel',
        'events',
        'general',
      ],
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    keywords: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true },
    metadata: {
      source: { type: String, trim: true }, // where this info comes from
      lastVerified: { type: Date },
      verifiedBy: { type: String, trim: true },
    },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

knowledgeSchema.index({ question: 'text', answer: 'text', keywords: 'text' });

export default mongoose.models.AIKnowledgeBase ||
  mongoose.model('AIKnowledgeBase', knowledgeSchema);
