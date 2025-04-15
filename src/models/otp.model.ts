import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
  identifier: { type: String, required: true, unique: true }, // email or phone
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
  type: { type: String, enum: ['email', 'phone'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-delete expired OTPs
OTPSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;