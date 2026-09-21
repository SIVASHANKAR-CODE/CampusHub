import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
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
    designation: { type: String, trim: true }, // e.g. "Assistant Professor"
    employeeId: { type: String, unique: true, trim: true },
    phone: { type: String, trim: true },
    photoUrl: { type: String, default: '' },
    subjects: [{ type: String, trim: true }], // Subject names they teach
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
