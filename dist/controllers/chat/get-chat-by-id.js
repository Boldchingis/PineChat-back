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
exports.getChatById = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getChatById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        if (!chatId) {
            res.status(400).json({
                success: false,
                code: "INVALID_REQUEST",
                message: "Chat ID is required",
            });
            return;
        }
        // Check if the user is a participant in this chat
        const chat = yield prisma.chat.findFirst({
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
        // Format the response
        let formattedChat = chat;
        // For direct chats, set the display name to the other participant's name
        if (!chat.isGroup && chat.participants.length === 2) {
            const otherUser = chat.participants.find(p => p.id !== userId);
            formattedChat = Object.assign(Object.assign({}, chat), { displayName: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.name) || "Unknown User", picture: ((_a = otherUser === null || otherUser === void 0 ? void 0 : otherUser.profile) === null || _a === void 0 ? void 0 : _a.image) || null });
        }
        else {
            formattedChat = Object.assign(Object.assign({}, chat), { displayName: chat.name, picture: null });
        }
        res.status(200).json({
            success: true,
            code: "CHAT_FETCHED",
            message: "Chat fetched successfully",
            data: formattedChat,
        });
    }
    catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.getChatById = getChatById;
