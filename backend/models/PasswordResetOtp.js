const mongoose = require('mongoose');

const passwordResetOtpSchema = mongoose.Schema(
  {
    email: { type: String, required: true, index: true, unique: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetOtp = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);

module.exports = PasswordResetOtp;
