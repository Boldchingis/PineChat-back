import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { Socket } from "socket.io";

// Middleware for Express routes
export const verify = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in Authorization header first, then in cookies
  const authHeader = req.headers.authorization;
  const { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken } = req.cookies || {};

  // Extract token from header or use cookie
  const accessToken = extractToken(authHeader) || cookieAccessToken;
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
    const decoded = jwt.verify(accessToken!, process.env.ACCESS_TOKEN_SECRET!) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
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

// Extract token from authorization header
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

// Middleware for Socket.io connections
export const verifySocketToken = (socket: Socket, next: (err?: Error) => void) => {
  const token = extractToken(socket.handshake.auth.token || socket.handshake.headers.authorization);

  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: number };
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
};
