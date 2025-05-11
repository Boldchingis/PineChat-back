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
exports.createChat = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, participants, isGroup = false } = req.body;
        // Get the user ID from the JWT token (set by middleware)
        const userId = req.userId;
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
            const existingChat = yield prisma.chat.findFirst({
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
        const newChat = yield prisma.chat.create({
            data: {
                name: isGroup ? name : undefined,
                isGroup,
                participants: {
                    connect: [
                        { id: userId },
                        ...participants.map((participantId) => ({ id: participantId })),
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
    }
    catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.createChat = createChat;
