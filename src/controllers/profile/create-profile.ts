import { Request, Response } from "express";
import { prisma } from "../../prismaClient"; 

export const createProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, about, avatarImage, socialMediaURL } = req.body;

  // Validate incoming data
  if (!name || !avatarImage) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "All fields (name,avatarImage) are required.",
    });
  }

  try {
    // Check if the user exists before creating a profile
    const user = await prisma.user.findUnique({
      where: { id },
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
        name,
        avatarImage,
        userId: id,
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
