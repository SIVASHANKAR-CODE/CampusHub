import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    employeeId: { type: String, unique: true, trim: true },
    phone: { type: String, trim: true },
    photoUrl: { type: String, default: '' },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Mentor || mongoose.model('Mentor', mentorSchema);
