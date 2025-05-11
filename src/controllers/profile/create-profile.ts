import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as any).userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
    return;
  }

  const { image, about } = req.body;
  if (!image) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Profile image is required.",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
      return;
    }

    let profile;

    if (user.profile) {
      profile = await prisma.profile.update({
        where: { id: user.profile.id },
        data: { image, about },
      });

      res.status(200).json({
        success: true,
        code: "PROFILE_UPDATED",
        message: "Profile updated successfully.",
        data: profile,
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          image,
          about: about || "",
          userId,
        },
      });

      res.status(201).json({
        success: true,
        code: "PROFILE_CREATED",
        message: "Profile created successfully.",
        data: profile,
      });
    }
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = (req as any).userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
    return;
  }

  const { name, image, about } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedUser = user;

      if (name) {
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: { name },
          include: { profile: true }, // ✅ ensure profile is included
        });
      }

      let profile = user.profile;
      if ((image || about !== undefined) && profile) {
        profile = await tx.profile.update({
          where: { id: profile.id },
          data: {
            ...(image && { image }),
            ...(about !== undefined && { about }),
          },
        });
      } else if (image || about !== undefined) {
        profile = await tx.profile.create({
          data: {
            image: image || "",
            about: about || "",
            userId,
          },
        });
      }

      return { user: updatedUser, profile };
    });

    const { password, ...userWithoutPassword } = result.user;

    res.status(200).json({
      success: true,
      code: "PROFILE_UPDATED",
      message: "Profile updated successfully.",
      data: {
        ...userWithoutPassword,
        profile: result.profile,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
