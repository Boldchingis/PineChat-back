import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Access Denied. No token provided" });
  }

  try {
    const decoded = jwt.verify(accessToken!, process.env.ACCESS_TOKEN_SECRET!) as any;
    req.user = decoded; // Attach decoded user info to request
    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError" && refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
        
        // Generate a new access token
        const newAccessToken = jwt.sign(
          { id: decodedRefresh.id, email: decodedRefresh.email },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: "15m" }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        req.user = decodedRefresh; // Attach refreshed user info to request
        return next();
      } catch (refreshError) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
