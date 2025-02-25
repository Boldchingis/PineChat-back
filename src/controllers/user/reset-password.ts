import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";  // To generate OTPs, you can use nanoid

const prisma = new PrismaClient();

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword, otp } = req.body;

  try {
    // Step 1: Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User does not exist.",
      });
    }

    // Step 2: Verify OTP
    const otpRecord = await prisma.otp.findFirst({
      where: { email, otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired.",
      });
    }

    // Step 3: Hash the new password
    const saltRounds = 10;
    const hashedPass = await bcrypt.hash(newPassword, saltRounds);

    // Step 4: Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPass },
    });

    // Step 5: Optionally delete the OTP record after successful use
    await prisma.otp.deleteMany({ where: { email } });

    res.status(200).json({
      success: true,
      code: "PASSWORD_UPDATED",
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error.",
    });
  }
};
