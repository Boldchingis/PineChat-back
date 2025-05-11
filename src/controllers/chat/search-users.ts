import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    const userId = (req as any).userId;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Search query is required",
      });
      return;
    }

    // Search users by name or email, excluding the current user
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            image: true,
            about: true,
          },
        },
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      code: "USERS_FOUND",
      message: "Users found successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};