import mongoose from 'mongoose';

const txSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    referenceNo: { type: String, trim: true },
    method: { type: String, trim: true }, // Online / Cash / DD
    description: { type: String, trim: true },
  },
  { _id: false }
);

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    regNo: { type: String, trim: true, index: true },
    registrationNumber: { type: String, trim: true, index: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true }, // e.g. "2025-2026"
    // Fee components
    tuitionFee: { type: Number, default: 0 },
    hostelFee: { type: Number, default: 0 },   // 0 for day scholars
    transportFee: { type: Number, default: 0 }, // 0 if not enrolled
    labFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },
    // Totals
    totalFee: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    // Status
    status: {
      type: String,
      enum: ['paid', 'partial', 'pending', 'overdue'],
      default: 'pending',
      index: true,
    },
    dueDate: { type: Date },
    transactionHistory: [txSchema],
    remarks: { type: String, trim: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feeSchema.pre('validate', function (next) {
  const sum = (this.tuitionFee || 0) + (this.hostelFee || 0) + (this.transportFee || 0) + (this.labFee || 0) + (this.examFee || 0) + (this.otherFee || 0);
  if (!this.totalFee || this.totalFee !== sum) {
    this.totalFee = sum > 0 ? sum : (this.totalFee || 0);
  }
  this.paidAmount = this.paidAmount || 0;
  this.dueAmount = Math.max(0, this.totalFee - this.paidAmount);
  if (this.dueAmount === 0 && this.totalFee > 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  if (this.regNo && !this.registrationNumber) this.registrationNumber = this.regNo;
  if (this.registrationNumber && !this.regNo) this.regNo = this.registrationNumber;
  next();
});

feeSchema.index({ studentId: 1, semester: 1, academicYear: 1 }, { unique: true });
feeSchema.index({ regNo: 1, semester: 1 });

export default mongoose.models.Fee || mongoose.model('Fee', feeSchema);
