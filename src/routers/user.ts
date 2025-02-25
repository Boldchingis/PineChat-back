import { Request, Response, Router } from 'express';
export const userRouter = Router();
userRouter.post("/sign in");
userRouter.post("/sign up");
userRouter.get("/forgot-password");
userRouter.post("/reset-password");