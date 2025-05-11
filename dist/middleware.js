"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySocketToken = exports.extractToken = exports.verify = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware for Express routes
const verify = (req, res, next) => {
    // Check for token in Authorization header first, then in cookies
    const authHeader = req.headers.authorization;
    const { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken } = req.cookies || {};
    // Extract token from header or use cookie
    const accessToken = (0, exports.extractToken)(authHeader) || cookieAccessToken;
    const refreshToken = cookieRefreshToken;
    if (!accessToken && !refreshToken) {
        res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Access denied. No token provided"
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        // If access token is invalid but we have a refresh token, we could implement token refresh here
        if (!refreshToken) {
            res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Access denied. No refresh token provided."
            });
            return;
        }
        // For now, just reject with an error
        res.status(401).json({
            success: false,
            code: "INVALID_TOKEN",
            message: "Invalid token. Please log in again."
        });
    }
};
exports.verify = verify;
// Extract token from authorization header
const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
};
exports.extractToken = extractToken;
// Middleware for Socket.io connections
const verifySocketToken = (socket, next) => {
    const token = (0, exports.extractToken)(socket.handshake.auth.token || socket.handshake.headers.authorization);
    if (!token) {
        return next(new Error('Authentication error: Token not provided'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.data.userId = decoded.userId;
        next();
    }
    catch (error) {
        return next(new Error('Authentication error: Invalid token'));
    }
};
exports.verifySocketToken = verifySocketToken;
