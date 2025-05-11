"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const user_1 = require("./routers/user");
const profile_1 = __importDefault(require("./routers/profile"));
const chat_1 = require("./routers/chat");
const middleware_1 = require("./middleware");
const client_1 = require("@prisma/client");
const algolia_1 = __importDefault(require("./services/algolia"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"],
        credentials: true,
    },
});
// Store online users
const onlineUsers = new Map(); // userId -> socketId
// Socket.io middleware for authentication
io.use(middleware_1.verifySocketToken);
// Socket.io connection handling
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    const userId = socket.data.userId;
    // Store user connection
    onlineUsers.set(userId, socket.id);
    // Broadcast user online status
    socket.broadcast.emit("user_status", { userId, status: "online" });
    // Handle private messages
    socket.on("private_message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { content, chatId, receiverId } = data;
        try {
            // Save message to database
            const message = yield saveMessage(parseInt(userId), content, parseInt(chatId));
            // Send to recipient if online
            const recipientSocketId = onlineUsers.get(receiverId.toString());
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("new_message", message);
            }
            // Send back to sender for confirmation
            socket.emit("message_sent", message);
        }
        catch (error) {
            console.error("Error sending message:", error);
            socket.emit("message_error", { error: "Failed to send message" });
        }
    }));
    // Handle group messages
    socket.on("group_message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { content, chatId } = data;
        try {
            // Save message to database
            const message = yield saveMessage(parseInt(userId), content, parseInt(chatId));
            // Broadcast to all users in the group
            socket.to(chatId.toString()).emit("new_message", message);
            // Send back to sender for confirmation
            socket.emit("message_sent", message);
        }
        catch (error) {
            console.error("Error sending group message:", error);
            socket.emit("message_error", { error: "Failed to send message" });
        }
    }));
    // Join a chat room
    socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        console.log(`User ${userId} joined chat ${chatId}`);
    });
    // Leave a chat room
    socket.on("leave_chat", (chatId) => {
        socket.leave(chatId);
        console.log(`User ${userId} left chat ${chatId}`);
    });
    // Handle typing status
    socket.on("typing", ({ chatId, isTyping }) => {
        socket.to(chatId).emit("user_typing", { userId, isTyping });
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        onlineUsers.delete(userId);
        socket.broadcast.emit("user_status", { userId, status: "offline" });
    });
});
// Function to save message to database
function saveMessage(senderId, content, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = new client_1.PrismaClient();
        try {
            // Check if the chat exists and the user is a participant
            const chat = yield prisma.chat.findFirst({
                where: {
                    id: chatId,
                    participants: {
                        some: {
                            id: senderId,
                        },
                    },
                },
            });
            if (!chat) {
                throw new Error("Chat not found or user not a participant");
            }
            // Create the message
            const newMessage = yield prisma.message.create({
                data: {
                    content,
                    chat: { connect: { id: chatId } },
                    sender: { connect: { id: senderId } },
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profile: true,
                        },
                    },
                },
            });
            // Update the chat's last activity time
            yield prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });
            return newMessage;
        }
        catch (error) {
            console.error("Error saving message:", error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000"],
    credentials: true,
}));
// Annotating the types of req and res
app.get("/", (req, res) => {
    res.send("Server is running...");
});
// Routes
app.use("/users", user_1.userRouter);
app.use("/profile", profile_1.default);
app.use("/chat", chat_1.chatRouter);
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is Running on http://localhost:${PORT}`);
    try {
        // Configure Algolia index and sync existing users
        yield algolia_1.default.configureAlgoliaIndex();
        yield algolia_1.default.syncUsersToAlgolia();
        console.log('Algolia initialized and users synced');
    }
    catch (error) {
        console.error('Failed to initialize Algolia:', error);
    }
}));
