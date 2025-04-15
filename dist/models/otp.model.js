"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OTPSchema = new mongoose_1.default.Schema({
    identifier: { type: String, required: true, unique: true }, // email or phone
    otp: { type: String, required: true },
    expiry: { type: Date, required: true },
    type: { type: String, enum: ['email', 'phone'], required: true },
    createdAt: { type: Date, default: Date.now }
});
// Auto-delete expired OTPs
OTPSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });
const OTP = mongoose_1.default.model("OTP", OTPSchema);
exports.default = OTP;
