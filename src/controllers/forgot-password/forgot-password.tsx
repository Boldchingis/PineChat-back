import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Rate Limiter (3 OTP requests per 5 minutes)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per window
  message: "Too many OTP requests. Please try again later.",
});

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

// Generate a secure OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User doesn't exist",
        success: false,
      });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    await prisma.otp.create({
      data: { email, otp: hashedOtp, createdAt: new Date() },
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

export const requestOTP = async (req: Request, res: Response) => {
  const { email, userOtp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User doesn't exist",
        success: false,
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({
        code: "OTP_NOT_FOUND",
        message: "No OTP found for this email",
        success: false,
      });
    }

    const otpAge = (new Date().getTime() - otpRecord.createdAt.getTime()) / 1000 / 60;
    if (otpAge > 5) {
      return res.status(400).json({
        code: "OTP_EXPIRED",
        message: "OTP has expired",
        success: false,
      });
    }

    const isOtpValid = await bcrypt.compare(userOtp.toString(), otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({
        code: "OTP_INCORRECT",
        message: "Incorrect OTP",
        success: false,
      });
    }

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

// Apply rate limiter to OTP request
export { otpLimiter };
