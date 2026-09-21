import mongoose from 'mongoose';

const libraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    author: { type: String, required: true, trim: true, index: 'text' },
    isbn: { type: String, unique: true, sparse: true, trim: true },
    bookId: { type: String, unique: true, trim: true },
    subject: { type: String, trim: true, index: true },
    department: { type: String, trim: true },
    publisher: { type: String, trim: true },
    edition: { type: String, trim: true },
    year: { type: Number },
    shelf: { type: String, trim: true }, // e.g. "C-12"
    totalCopies: { type: Number, required: true, min: 0 },
    availableCopies: { type: Number, required: true, min: 0 },
    issuedCopies: { type: Number, default: 0 },
    reservedCopies: { type: Number, default: 0 },
    expectedReturnDate: { type: Date },
    language: { type: String, default: 'English', trim: true },
    category: { type: String, trim: true },
    coverImageUrl: { type: String },
    description: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Full-text search index
libraryBookSchema.index({ title: 'text', author: 'text', isbn: 'text', subject: 'text' });

export default mongoose.models.LibraryBook || mongoose.model('LibraryBook', libraryBookSchema);
