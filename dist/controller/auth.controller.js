"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../models/user.model"));
const otp_model_1 = __importDefault(require("../models/otp.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const otp_1 = require("../config/otp");
const utils_1 = require("../utils");
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, password, phone } = req.body;
        if (!(0, utils_1.isValidEmail)(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email already taken" });
            return;
        }
        const existingPhoneUser = yield user_model_1.default.findOne({ phone });
        if (existingPhoneUser) {
            res.status(400).json({ message: "Phone number already registered" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        req.session = req.session || {};
        req.session.pendingUser = {
            fullName,
            email,
            password: hashedPassword,
            phone,
            verified: false
        };
        res.status(200).json({
            message: "Please proceed with verification",
            nextStep: "selectVerificationMethod"
        });
    }
    catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
const selectVerificationMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { method } = req.body;
        if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.pendingUser)) {
            res.status(400).json({ message: "Please complete registration form first" });
            return;
        }
        const { email, phone } = req.session.pendingUser;
        const otp = (0, otp_1.generateOTP)();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10);
        let success = false;
        const identifier = method === "email" ? email : phone;
        yield otp_model_1.default.findOneAndDelete({ identifier });
        if (method === "email") {
            success = yield (0, otp_1.sendEmailOTP)(email, otp);
            if (success) {
                yield otp_model_1.default.create({
                    identifier: email,
                    otp,
                    expiry: expiryTime,
                    type: 'email'
                });
            }
        }
        else if (method === "phone") {
            success = yield (0, otp_1.sendSmsOTP)(phone, otp);
            if (success) {
                yield otp_model_1.default.create({
                    identifier: phone,
                    otp,
                    expiry: expiryTime,
                    type: 'phone'
                });
            }
        }
        else {
            res.status(400).json({ message: "Invalid verification method" });
            return;
        }
        if (success) {
            res.status(200).json({
                message: `OTP sent to your ${method}`,
                verificationMethod: method
            });
        }
        else {
            res.status(500).json({ message: `Failed to send OTP to ${method}` });
        }
    }
    catch (err) {
        console.error("Verification Method Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, phone, otp } = req.body;
        if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.pendingUser)) {
            res.status(400).json({ message: "No pending registration found" });
            return;
        }
        const identifier = email || phone;
        if (!identifier) {
            res.status(400).json({ message: "Email or phone is required" });
            return;
        }
        const otpRecord = yield otp_model_1.default.findOne({ identifier });
        if (!otpRecord) {
            res.status(400).json({ message: "No OTP was requested for this contact" });
            return;
        }
        if (otpRecord.expiry < new Date()) {
            yield otp_model_1.default.deleteOne({ identifier });
            res.status(400).json({ message: "OTP has expired" });
            return;
        }
        if (otpRecord.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        const { fullName, email: userEmail, password, phone: userPhone } = req.session.pendingUser;
        const newUser = yield user_model_1.default.create({
            fullName,
            email: userEmail,
            password,
            phone: userPhone
        });
        yield otp_model_1.default.deleteOne({ identifier });
        delete req.session.pendingUser;
        res.status(201).json({
            message: "User created successfully",
            userId: newUser._id
        });
    }
    catch (err) {
        console.error("OTP Verification Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "1234567", { expiresIn: "1d" });
        res
            .cookie("uuid", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        })
            .status(200)
            .json({ message: "User logged in", token });
    }
    catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
const AuthController = {
    register,
    login,
    selectVerificationMethod,
    verifyOTP
};
exports.default = AuthController;
