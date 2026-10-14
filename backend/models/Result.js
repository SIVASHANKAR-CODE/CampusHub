import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    semester: { type: Number, required: true, index: true },
    academicYear: { type: String, required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true },
    grade: { type: String, trim: true }, // A+, A, B+, B, C, D, F
    gradePoint: { type: Number },        // 10, 9, 8, 7, 6, 5, 0
    result: {
      type: String,
      enum: ['pass', 'fail', 'absent', 'malpractice', 'withheld'],
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

resultSchema.index({ studentId: 1, semester: 1, academicYear: 1 });
resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export default mongoose.models.Result || mongoose.model('Result', resultSchema);
