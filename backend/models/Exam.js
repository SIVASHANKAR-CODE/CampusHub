import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    semester: { type: Number, required: true, index: true },
    section: { type: String, trim: true }, // null = all sections
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    examType: {
      type: String,
      enum: ['internal', 'model', 'semester', 'practical', 'viva', 'other'],
      required: true,
    },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "12:00"
    venue: { type: String, trim: true },
    hallNo: { type: String, trim: true },
    maxMarks: { type: Number, default: 100 },
    instructions: { type: String, trim: true },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

examSchema.index({ department: 1, year: 1, semester: 1, date: 1 });

export default mongoose.models.Exam || mongoose.model('Exam', examSchema);
