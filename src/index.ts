import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { userRouter } from "./routers/user";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5000"],
    credentials: true,
  })
);
// Annotating the types of req and res
app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});
app.use("/users", userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is Running on http://localhost:${PORT}`);
});
