import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).userId;

    if (!chatId) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Chat ID is required",
      });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        participants: {
          some: {
            id: userId,
          },
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
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

    let formattedChat: any;
    if (!chat.isGroup && chat.participants.length === 2) {
      const otherUser = chat.participants.find((p: any) => p.id !== userId);
      formattedChat = {
        ...chat,
        displayName: otherUser?.name || "Unknown User",
        picture: otherUser?.profile?.image || null,
      };
    } else {
      formattedChat = {
        ...chat,
        displayName: chat.name,
        picture: null,
      };
    }

    res.status(200).json({
      success: true,
      code: "CHAT_FETCHED",
      message: "Chat fetched successfully",
      data: formattedChat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
