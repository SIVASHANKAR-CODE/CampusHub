import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['technical', 'cultural', 'sports', 'academic', 'social', 'other'],
      required: true,
    },
    logoUrl: { type: String, default: '' },
    presidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    presidentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    faculty_advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    isActive: { type: Boolean, default: true },
    foundedDate: { type: Date },
    socialLinks: {
      instagram: { type: String },
      linkedin: { type: String },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
  },
  { timestamps: true }
);

export default mongoose.models.Club || mongoose.model('Club', clubSchema);
