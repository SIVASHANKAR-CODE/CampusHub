import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    regNo: { type: String, required: true, unique: true, trim: true, index: true },
    registrationNumber: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, min: 1, max: 5, index: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    section: { type: String, required: true, trim: true, index: true },
    batch: { type: String, trim: true }, // e.g. "2023-2027"
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true },
    college: { type: String, default: 'CampusHub Engineering College' },
    phone: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    photoUrl: { type: String, default: '' },
    // Controlled exclusively by Admin
    hostelStatus: {
      type: String,
      enum: ['hosteller', 'day_scholar'],
      default: 'day_scholar',
      index: true,
    },
    transportEligible: { type: Boolean, default: false },
    busNumber: { type: String, trim: true },
    busRoute: { type: String, trim: true },
    pickupPoint: { type: String, trim: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

studentSchema.pre('validate', function (next) {
  if (this.regNo && !this.registrationNumber) {
    this.registrationNumber = this.regNo;
  } else if (this.registrationNumber && !this.regNo) {
    this.regNo = this.registrationNumber;
  }
  next();
});

studentSchema.index({ regNo: 1, registrationNumber: 1 });
studentSchema.index({ department: 1, year: 1, semester: 1, section: 1 });

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
