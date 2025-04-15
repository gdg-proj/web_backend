import nodemailer from "nodemailer";
import twilio from "twilio";
  
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const sendEmailOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
  
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Registration",
        text: `Your OTP for registration is: ${otp}. This code will expire in 10 minutes.`,
        html: `<p>Your OTP for registration is: <strong>${otp}</strong>. This code will expire in 10 minutes.</p>`,
      });
  
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  };
  
  // Send OTP via SMS
  const sendSmsOTP = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
  
      await client.messages.create({
        body: `Your OTP for registration is: ${otp}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
  
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  };

  export {generateOTP,sendEmailOTP,sendSmsOTP}