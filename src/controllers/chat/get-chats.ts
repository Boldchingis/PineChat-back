import { Request, Response } from "express";
import { PrismaClient, Chat, Participant, Message } from "@prisma/client";

const prisma = new PrismaClient();

export const getChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { limit = 20, offset = 0 } = req.query;

    const chats = await prisma.chat.findMany({
      where: {
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
          take: 1,
        },
      },
      orderBy: [
        { createdAt: "desc" } // use createdAt instead of updatedAt
      ],
      take: Number(limit),
      skip: Number(offset),
    });

    const formattedChats = chats.map((chat: any) => {
      if (!chat.isGroup && chat.participants.length === 2) {
        const otherUser = chat.participants.find((p: any) => p.id !== userId);
        return {
          ...chat,
          displayName: otherUser?.name || "Unknown User",
          picture: otherUser?.profile?.image || null,
        };
      }
      return {
        ...chat,
        displayName: chat.name,
        picture: null,
      };
    });

    res.status(200).json({
      success: true,
      code: "CHATS_FETCHED",
      message: "Chats fetched successfully",
      data: formattedChats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
