const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'mentor', 'counselor', 'student'],
      required: true,
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // Richer tri-state status alongside the existing isActive flag (kept in
    // sync automatically below) so the UI can distinguish "temporarily
    // suspended" from "deactivated" without touching existing isActive checks.
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Set true for accounts created by an Admin; cleared on first password change.
    mustChangePassword: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Keep the existing isActive boolean (used throughout existing auth
// middleware/controllers) in sync with the new tri-state status field.
userSchema.pre('save', function syncIsActive(next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  } else if (this.isModified('isActive') && !this.isModified('status')) {
    this.status = this.isActive ? 'active' : 'inactive';
  }
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model('User', userSchema);
