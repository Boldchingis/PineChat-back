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
exports.getChats = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { limit = 20, offset = 0 } = req.query;
        const chats = yield prisma.chat.findMany({
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
            orderBy: {
                updatedAt: "desc",
            },
            take: Number(limit),
            skip: Number(offset),
        });
        // Format the response
        const formattedChats = chats.map(chat => {
            var _a;
            // For direct chats, set the chat name to the name of the other participant
            if (!chat.isGroup && chat.participants.length === 2) {
                const otherUser = chat.participants.find(p => p.id !== userId);
                return Object.assign(Object.assign({}, chat), { displayName: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.name) || "Unknown User", picture: ((_a = otherUser === null || otherUser === void 0 ? void 0 : otherUser.profile) === null || _a === void 0 ? void 0 : _a.image) || null });
            }
            return Object.assign(Object.assign({}, chat), { displayName: chat.name, picture: null });
        });
        res.status(200).json({
            success: true,
            code: "CHATS_FETCHED",
            message: "Chats fetched successfully",
            data: formattedChats,
        });
    }
    catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.getChats = getChats;
