import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, participants, isGroup = false } = req.body;
    // Get the user ID from the JWT token (set by middleware)
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
      return;
    }

    // For direct chats, check if already exists between these two users
    if (!isGroup && participants.length === 1) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { id: userId } } },
            { participants: { some: { id: participants[0] } } },
          ],
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (existingChat) {
        res.status(200).json({
          success: true,
          code: "CHAT_EXISTS",
          message: "Chat already exists",
          data: existingChat,
        });
        return;
      }
    }

    // Create a new chat
    const newChat = await prisma.chat.create({
      data: {
        name: isGroup ? name : undefined,
        isGroup,
        participants: {
          connect: [
            { id: userId },
            ...participants.map((participantId: number) => ({ id: participantId })),
          ],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      code: "CHAT_CREATED",
      message: "Chat created successfully",
      data: newChat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};