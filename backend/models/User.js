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
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: account locked?
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Virtual alias: profilePhoto -> photoUrl
userSchema.virtual('profilePhoto').get(function () {
  return this.photoUrl || '';
});

export default mongoose.models.User || mongoose.model('User', userSchema);
