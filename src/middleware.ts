import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export const verify = (req: Request, res: Response, next: NextFunction) => {
  const { accessToken, refreshToken } = req.cookies;
  if (!accessToken && !refreshToken) {
    res.status(401).send("Access Denied. No token provided");
    return;
  }

  try {
    jwt.verify(accessToken!, process.env.ACCESS_TOKEN_SECRET!);
    next();
  } catch (error) {
    if (!refreshToken) {
      res.status(401).send("Access Denied. No refresh token provided.");
    }
    res.status(400).send("Invalid Token");
  }
};