"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatId } = req.params;
        const { limit = 50, before } = req.query;
        const userId = req.userId;
        // Check if the chat exists and the user is a participant
        const chat = yield prisma.chat.findFirst({
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
        let whereCondition = {
            chatId: parseInt(chatId),
        };
        // Add pagination based on message ID
        if (before) {
            whereCondition.id = {
                lt: parseInt(before),
            };
        }
        // Fetch messages
        const messages = yield prisma.message.findMany({
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
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.getMessages = getMessages;
