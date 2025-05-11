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
exports.createMessage = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const senderId = req.userId;
        if (!content || !chatId) {
            res.status(400).json({
                success: false,
                code: "INVALID_REQUEST",
                message: "Message content and chat ID are required",
            });
            return;
        }
        // Check if the chat exists and the user is a participant
        const chat = yield prisma.chat.findFirst({
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
        // Create the message
        const newMessage = yield prisma.message.create({
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
        // Update the chat's last activity time
        yield prisma.chat.update({
            where: { id: parseInt(chatId) },
            data: { updatedAt: new Date() },
        });
        res.status(201).json({
            success: true,
            code: "MESSAGE_CREATED",
            message: "Message created successfully",
            data: newMessage,
        });
        // Note: Real-time notification will be handled by Socket.io separately
    }
    catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.createMessage = createMessage;
