import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = (req as any).userId;

    if (!content || !chatId) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Message content and chat ID are required",
      });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        participants: {
          some: {
            id: senderId,
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

    const newMessage = await prisma.message.create({
      data: {
        content,
        chat: { connect: { id: parseInt(chatId) } },
        sender: { connect: { id: senderId } },
      },
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
    });

    res.status(201).json({
      success: true,
      code: "MESSAGE_CREATED",
      message: "Message created successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};
