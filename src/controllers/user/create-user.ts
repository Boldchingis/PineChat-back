import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { generateAccessToken } from "./generateAccessToken"; // Ensure this function is correctly implemented

dotenv.config();
const prisma = new PrismaClient();
const saltRounds = 10;

// Check if a user exists based on a specific field
const isUserExist = async (field: any) => {
  return await prisma.user.findUnique({ where: field });
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body; // 'name' instead of 'username'

  try {
    // Check if user already exists
    const existingUser = await isUserExist({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      });
      return;
    }

    // Hash the password before saving
    const hashedPass = await bcrypt.hash(password, saltRounds);

    // Create new user and profile
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPass,
        name,
        profile: {
          create: {
            image: "", // Default or empty image
            about: "", // Optionally, allow this to be optional or passed in
          },
        },
      },
    });

    // Handle JWT Token creation
    const refreshToken = jwt.sign(
      { userId: newUser.id },
      process.env.REFRESH_TOKEN_SECRET || "default_secret", // Ensure the secret is set in env
      { expiresIn: "24h" }
    );

    const accessToken = generateAccessToken(newUser.id.toString()); // Ensure this function works

    // Respond with success message and tokens
    res.status(201).json({
      success: true,
      code: "SUCCESS",
      message: "User created successfully",
      data: { id: newUser.id, email: newUser.email, name: newUser.name },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};

export const fetchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users' basic information
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }, // Select the necessary fields
    });

    res.json({
      success: true,
      code: "FETCH_SUCCESS",
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
