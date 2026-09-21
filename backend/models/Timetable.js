import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    period: { type: Number, required: true, min: 1, max: 10 },
    startTime: { type: String, required: true },  // "09:00"
    endTime: { type: String, required: true },     // "09:50"
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    facultyName: { type: String, trim: true },
    room: { type: String, trim: true },
    isLab: { type: Boolean, default: false },
    labDuration: { type: Number, default: 1 }, // number of periods
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    semester: { type: Number, required: true, index: true },
    section: { type: String, required: true, trim: true, index: true },
    academicYear: { type: String, required: true },
    effectiveFrom: { type: Date, required: true },
    slots: [slotSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timetableSchema.index(
  { department: 1, year: 1, semester: 1, section: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
