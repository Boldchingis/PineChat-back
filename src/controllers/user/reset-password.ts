import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, newPassword, otp } = req.body;

  try {
    // Step 1
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User does not exist.",
      });
      return;
    }

    // Step 2
    const otpRecord = await prisma.otp.findFirst({
      where: { email, otp },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP.",
      });
      return;
    }

    // Step 3: Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      // Delete expired OTP record for clean-up
      await prisma.otp.deleteMany({ where: { email } });
      res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired.",
      });
      return;
    }

    // Step 4
    const saltRounds = 10;
    const hashedPass = await bcrypt.hash(newPassword, saltRounds);

    // Step 5
    await prisma.user.update({
      where: { email },
      data: { password: hashedPass },
    });

    // Step 6
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
