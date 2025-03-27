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
exports.createProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        res.status(400).json({
            success: false,
            code: "INVALID_USER_ID",
            message: "User ID must be a valid number.",
        });
        return;
    }
    const { image, about } = req.body;
    if (!image) {
        res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Profile image is required.",
        });
        return;
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found.",
            });
            return;
        }
        const newProfile = yield prisma.profile.create({
            data: {
                image,
                about,
                userId,
            },
        });
        res.status(201).json({
            success: true,
            code: "PROFILE_CREATED_SUCCESSFULLY",
            message: "Profile created successfully.",
            data: newProfile,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createProfile = createProfile;
