import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createProfile = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id); 
  const { image, about } = req.body;
  if (!image) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Profile image is required.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    const newProfile = await prisma.profile.create({
      data: {
        image,
        about,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      code: "PROFILE_CREATED_SUCCESSFULLY",
      message: "Profile created successfully.",
      data: newProfile,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error.",
    });
  }
};
