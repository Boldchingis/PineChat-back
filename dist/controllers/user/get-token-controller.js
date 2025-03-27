"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getTokenController = (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            code: "NO_REFRESH_TOKEN",
            message: "Access Denied. No refresh token provided.",
        });
    }
    const refreshToken = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret");
        if (typeof decoded === "string" || !("userId" in decoded)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_TOKEN",
                message: "Invalid refresh token format.",
            });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET || "default_access_secret", { expiresIn: "1h" });
        res
            .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
            .json({
            success: true,
            code: "TOKEN_REFRESHED",
            message: "Access token refreshed successfully.",
            accessToken,
        });
    }
    catch (error) {
        console.error("Error verifying refresh token:", error);
        res.status(403).json({
            success: false,
            code: "INVALID_REFRESH_TOKEN",
            message: "Invalid or expired refresh token.",
        });
    }
    console.log(refreshToken);
};
exports.getTokenController = getTokenController;
