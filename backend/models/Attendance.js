import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, index: true },
    subjectCode: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'od', 'leave', 'holiday'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    period: { type: Number, required: true, min: 1, max: 10, index: true }, // 1–8 (or 10)
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, date: 1, period: 1 }, { unique: true });
attendanceSchema.index({ department: 1, year: 1, semester: 1, section: 1, date: 1, period: 1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
