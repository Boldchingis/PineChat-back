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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword, otp } = req.body;
    try {
        // Step 1
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User does not exist.",
            });
            return;
        }
        // Step 2
        const otpRecord = yield prisma.otp.findFirst({
            where: { email, otp },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            res.status(400).json({
                success: false,
                code: "INVALID_OTP",
                message: "Invalid OTP.",
            });
            return;
        }
        // Step 3: Check if OTP has expired
        if (otpRecord.expiresAt < new Date()) {
            // Delete expired OTP record for clean-up
            yield prisma.otp.deleteMany({ where: { email } });
            res.status(400).json({
                success: false,
                code: "OTP_EXPIRED",
                message: "OTP has expired.",
            });
            return;
        }
        // Step 4
        const saltRounds = 10;
        const hashedPass = yield bcrypt_1.default.hash(newPassword, saltRounds);
        // Step 5
        yield prisma.user.update({
            where: { email },
            data: { password: hashedPass },
        });
        // Step 6
        yield prisma.otp.deleteMany({ where: { email } });
        res.status(200).json({
            success: true,
            code: "PASSWORD_UPDATED",
            message: "Password updated successfully.",
        });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error.",
        });
    }
});
exports.resetPassword = resetPassword;
