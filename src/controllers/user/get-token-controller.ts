import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const getTokenController = (req: Request, res: Response) => {
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
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret"
    );

    if (typeof decoded === "string" || !("userId" in decoded)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid refresh token format.",
      });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET || "default_access_secret",
      { expiresIn: "1h" }
    );

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
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    res.status(403).json({
      success: false,
      code: "INVALID_REFRESH_TOKEN",
      message: "Invalid or expired refresh token.",
    });
  }
  console.log(refreshToken);
};
