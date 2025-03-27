"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = require("./routers/user");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5000"],
    credentials: true,
}));
// Annotating the types of req and res
app.get("/", (req, res) => {
    res.send("Server is running...");
});
app.use("/users", user_1.userRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is Running on http://localhost:${PORT}`);
});
