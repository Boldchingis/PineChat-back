import { Router } from "express";
import { createUser } from "../controllers/user/create-user";
import { signinController } from "../controllers/user/sign-in";
import { forgotPassword } from "../controllers/forgot-password/forgot-password";
import { resetPassword } from "../controllers/user/reset-password";

export const userRouter = Router();

// User routes
userRouter.post("/sign-in", signinController);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/create-user", createUser);
