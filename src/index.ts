import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { userRouter } from "./routers/user";
import profileRouter from "./routers/profile";
import { chatRouter } from "./routers/chat";
import { verifySocketToken } from "./middleware";
import { PrismaClient } from "@prisma/client";
import algoliaService from "./services/algolia";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true,
  },
});

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Socket.io middleware for authentication
io.use(verifySocketToken);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  const userId = socket.data.userId;
  
  // Store user connection
  onlineUsers.set(userId, socket.id);
  
  // Broadcast user online status
  socket.broadcast.emit("user_status", { userId, status: "online" });
  
  // Handle private messages
  socket.on("private_message", async (data) => {
    const { content, chatId, receiverId } = data;

    try {
      // Save message to database
      const message = await saveMessage(parseInt(userId), content, parseInt(chatId));

      // Send to recipient if online
      const recipientSocketId = onlineUsers.get(receiverId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new_message", message);
      }

      // Send back to sender for confirmation
      socket.emit("message_sent", message);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Handle group messages
  socket.on("group_message", async (data) => {
    const { content, chatId } = data;

    try {
      // Save message to database
      const message = await saveMessage(parseInt(userId), content, parseInt(chatId));

      // Broadcast to all users in the group
      socket.to(chatId.toString()).emit("new_message", message);

      // Send back to sender for confirmation
      socket.emit("message_sent", message);
    } catch (error) {
      console.error("Error sending group message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });
  
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
async function saveMessage(senderId: number, content: string, chatId: number) {
  const prisma = new PrismaClient();

  try {
    // Check if the chat exists and the user is a participant
    const chat = await prisma.chat.findFirst({
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
    const newMessage = await prisma.message.create({
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
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return newMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// Annotating the types of req and res
app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

// Routes
app.use("/users", userRouter);
app.use("/profile", profileRouter);
app.use("/chat", chatRouter);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`Server is Running on http://localhost:${PORT}`);

  try {
    // Configure Algolia index and sync existing users
    await algoliaService.configureAlgoliaIndex();
    await algoliaService.syncUsersToAlgolia();
    console.log('Algolia initialized and users synced');
  } catch (error) {
    console.error('Failed to initialize Algolia:', error);
  }
});
