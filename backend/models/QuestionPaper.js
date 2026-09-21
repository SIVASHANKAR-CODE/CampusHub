import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    subjectCode: { type: String, trim: true },
    semester: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true }, // exam year e.g. 2024
    academicYear: { type: String, required: true, trim: true }, // e.g. "2023-2024"
    examType: {
      type: String,
      enum: ['internal', 'model', 'semester', 'practical', 'other'],
      required: true,
      index: true,
    },
    fileUrl: { type: String, required: true }, // Cloudinary URL
    fileName: { type: String, trim: true },
    fileSize: { type: Number }, // bytes
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionPaperSchema.index({ department: 1, semester: 1, subject: 1, year: -1 });

export default mongoose.models.QuestionPaper ||
  mongoose.model('QuestionPaper', questionPaperSchema);
