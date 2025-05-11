import { Router } from "express";
import { verify } from "../middleware";
import { createChat } from "../controllers/chat/create-chat";
import { getChats } from "../controllers/chat/get-chats";
import { getChatById } from "../controllers/chat/get-chat-by-id";
import { createMessage } from "../controllers/chat/create-message";
import { getMessages } from "../controllers/chat/get-messages";
import { searchUsers } from "../controllers/chat/search-users";
import { searchUsersAlgolia } from "../controllers/chat/search-users-algolia";

export const chatRouter = Router();

// Apply authentication middleware to all chat routes
chatRouter.use(verify);

// Chat routes
chatRouter.post("/create", createChat);
chatRouter.get("/", getChats);
chatRouter.get("/:chatId", getChatById);
chatRouter.post("/:chatId/messages", createMessage);
chatRouter.get("/:chatId/messages", getMessages);
chatRouter.get("/search/users", searchUsers);
chatRouter.get("/search/algolia", searchUsersAlgolia);
