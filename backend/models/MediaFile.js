import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    originalname: {
      type: String,
      default: '',
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MediaFile || mongoose.model('MediaFile', mediaFileSchema);
