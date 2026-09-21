import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in queries unless explicitly selected
    },
    role: {
      type: String,
      enum: [
        'student',
        'faculty',
        'mentor',
        'admin',
        'maintenance',
        'transport_staff',
        'driver',
        'security',
        'club_president',
      ],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

// Virtual: account locked?
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

export default mongoose.models.User || mongoose.model('User', userSchema);
