import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = (req as any).userId;

    // Check if the chat exists and the user is a participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!chat) {
      res.status(404).json({
        success: false,
        code: "CHAT_NOT_FOUND",
        message: "Chat not found or you don't have access to it",
      });
      return;
    }

    // Build the query
    let whereCondition: any = {
      chatId: parseInt(chatId),
    };

    // Add pagination based on message ID
    if (before) {
      whereCondition.id = {
        lt: parseInt(before as string),
      };
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereCondition,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Number(limit),
    });

    // Return messages in chronological order (oldest first)
    const sortedMessages = [...messages].reverse();

    res.status(200).json({
      success: true,
      code: "MESSAGES_FETCHED",
      message: "Messages fetched successfully",
      data: sortedMessages,
      pagination: {
        hasMore: messages.length === Number(limit),
        nextCursor: messages.length > 0 ? messages[messages.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};