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
exports.searchUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        const userId = req.userId;
        if (!query || typeof query !== 'string') {
            res.status(400).json({
                success: false,
                code: "INVALID_REQUEST",
                message: "Search query is required",
            });
            return;
        }
        // Search users by name or email, excluding the current user
        const users = yield prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
                NOT: {
                    id: userId,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile: {
                    select: {
                        image: true,
                        about: true,
                    },
                },
            },
            take: 20,
        });
        res.status(200).json({
            success: true,
            code: "USERS_FOUND",
            message: "Users found successfully",
            data: users,
        });
    }
    catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.searchUsers = searchUsers;
