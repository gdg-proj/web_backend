import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import OTP from "../models/otp.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateOTP, sendEmailOTP, sendSmsOTP } from "../config/otp";
import { isValidEmail } from "../utils";

interface RegisterRequestBody {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

interface OtpVerifyRequestBody {
  email?: string;
  phone?: string;
  otp: string;
}

const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, email, password, phone }: RegisterRequestBody = req.body;

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already taken" });
      return;
    }

    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      res.status(400).json({ message: "Phone number already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
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
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const selectVerificationMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { method } = req.body;
    
    if (!req.session?.pendingUser) {
      res.status(400).json({ message: "Please complete registration form first" });
      return;
    }
    
    const { email, phone } = req.session.pendingUser;
    const otp = generateOTP();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    
    let success = false;
    const identifier = method === "email" ? email : phone;

    await OTP.findOneAndDelete({ identifier });
    
    if (method === "email") {
      success = await sendEmailOTP(email, otp);
      if (success) {
        await OTP.create({
          identifier: email,
          otp,
          expiry: expiryTime,
          type: 'email'
        });
      }
    } else if (method === "phone") {
      success = await sendSmsOTP(phone, otp);
      if (success) {
        await OTP.create({
          identifier: phone,
          otp,
          expiry: expiryTime,
          type: 'phone'
        });
      }
    } else {
      res.status(400).json({ message: "Invalid verification method" });
      return;
    }
    
    if (success) {
      res.status(200).json({ 
        message: `OTP sent to your ${method}`,
        verificationMethod: method
      });
    } else {
      res.status(500).json({ message: `Failed to send OTP to ${method}` });
    }
  } catch (err) {
    console.error("Verification Method Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, otp }: OtpVerifyRequestBody = req.body;
    
    if (!req.session?.pendingUser) {
      res.status(400).json({ message: "No pending registration found" });
      return;
    }
    
    const identifier = email || phone;
    if (!identifier) {
      res.status(400).json({ message: "Email or phone is required" });
      return;
    }
    
    const otpRecord = await OTP.findOne({ identifier });
    if (!otpRecord) {
      res.status(400).json({ message: "No OTP was requested for this contact" });
      return;
    }
    
    if (otpRecord.expiry < new Date()) {
      await OTP.deleteOne({ identifier });
      res.status(400).json({ message: "OTP has expired" });
      return;
    }
    
    if (otpRecord.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    
    const { fullName, email: userEmail, password, phone: userPhone } = req.session.pendingUser;
    
    const newUser = await User.create({
      fullName,
      email: userEmail,
      password,
      phone: userPhone
    });
    
    await OTP.deleteOne({ identifier });
    delete req.session.pendingUser;
    
    res.status(201).json({ 
      message: "User created successfully", 
      userId: newUser._id 
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "1234567",
      { expiresIn: "1d" }
    );

    res
      .cookie("uuid", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({ message: "User logged in", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const AuthController = { 
  register, 
  login, 
  selectVerificationMethod, 
  verifyOTP 
};

export default AuthController;