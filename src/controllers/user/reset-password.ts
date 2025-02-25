import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User does not exist.",
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPass = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPass },
    });

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
