import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "./generateAccessToken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const signinController = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }, // Removed bankCard from include
    });

    if (!user) {
      res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User does not exist.",
      });
      return;
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        code: "PASSWORD_INCORRECT",
        message: "Incorrect password.",
      });
      return;
    }

    // Generate tokens
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret",
      { expiresIn: "24h" }
    );

    const accessToken = generateAccessToken(user.id.toString());

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      code: "SIGNED_IN",
      message: "User signed in successfully.",
      data: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error.",
    });
  }
};
