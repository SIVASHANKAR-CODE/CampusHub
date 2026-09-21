import mongoose from 'mongoose';

const hostelStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    roomNumber: { type: String, required: true, trim: true },
    blockName: { type: String, required: true, trim: true },
    floorNumber: { type: Number, required: true },
    roomType: { type: String, enum: ['single', 'double', 'triple'], default: 'double' },
    wardenName: { type: String, trim: true },
    wardenPhone: { type: String, trim: true },
    wardenEmail: { type: String, trim: true },
    joinDate: { type: Date },
    vacateDate: { type: Date },
    isActive: { type: Boolean, default: true },
    remarks: { type: String, trim: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.HostelStudent ||
  mongoose.model('HostelStudent', hostelStudentSchema);
