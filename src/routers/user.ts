import { Request, Response, Router } from 'express';

export const userRouter = Router();

// User sign-in route
userRouter.post("/sign-in", (req: Request, res: Response) => {
    res.send("User sign-in endpoint");
});

// User sign-up route
userRouter.post("/sign-up", (req: Request, res: Response) => {
    res.send("User sign-up endpoint");
});

// Forgot password route
userRouter.get("/forgot-password", (req: Request, res: Response) => {
    res.send("Forgot password endpoint");
});

// Reset password route
userRouter.post("/reset-password", (req: Request, res: Response) => {
    res.send("Reset password endpoint");
});
