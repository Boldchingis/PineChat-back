import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

// ✅ Rate Limiter (3 OTP requests per 5 minutes per email)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.email, // ✅ Limit by email instead of IP
  message: "Too many OTP requests. Please try again later.",
});

// ✅ Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generate a secure OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// ✅ Function to clean expired OTPs every hour
const cleanupExpiredOtps = async () => {
  try {
    await prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
};
setInterval(cleanupExpiredOtps, 60 * 60 * 1000); // Run every hour

// ✅ Forgot Password (Send OTP)
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User doesn't exist",
        success: false,
      });
      return;
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    await prisma.otp.create({
      data: { email, otp: hashedOtp, createdAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60000) },
    });

    await transporter.sendMail({
      from: '"PineChat" <noreply@pinechat.com>',
      to: email,
      subject: "Reset Your Password - PineChat",
      html: `<div style="max-width:600px;margin:20px auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.1);text-align:center;font-family:Arial,sans-serif;">
        <h2>Reset Your Password</h2>
        <p>Use the OTP below to reset your password:</p>
        <div style="font-size:28px;font-weight:bold;color:#333;background:#f8f8f8;padding:10px 20px;display:inline-block;border-radius:5px;margin:20px 0;">${otp}</div>
        <p>This OTP expires in 5 minutes. If you didn't request this, ignore this email.</p>
        <div style="font-size:12px;color:#777;margin-top:20px;">&copy; 2025 PineChat. All rights reserved.</div>
      </div>`,
    });

    res.json({
      code: "SENT_OTP",
      message: "OTP sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Internal server error",
      success: false,
    });
  }
};

// ✅ Verify OTP
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, userOtp } = req.body;

  try {
    const otpRecord = await prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      res.status(400).json({
        code: "OTP_NOT_FOUND",
        message: "No OTP found for this email",
        success: false,
      });
      return;
    }

    // ✅ Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      await prisma.otp.deleteMany({ where: { email } }); // ✅ Ensure expired OTPs are deleted
      res.status(400).json({
        code: "OTP_EXPIRED",
        message: "OTP has expired",
        success: false,
      });
      return;
    }

    // ✅ Validate OTP
    const isOtpValid = await bcrypt.compare(userOtp.toString(), otpRecord.otp);
    if (!isOtpValid) {
      res.status(400).json({
        code: "OTP_INCORRECT",
        message: "Incorrect OTP",
        success: false,
      });
      return;
    }

    // ✅ Delete OTP after successful verification
    await prisma.otp.deleteMany({ where: { email } });

    res.json({
      code: "OTP_VERIFIED",
      message: "Successfully verified OTP",
      success: true,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Internal server error",
      success: false,
    });
  }
};

// ✅ Apply rate limiter to OTP request
export { otpLimiter };
