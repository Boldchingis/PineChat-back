"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../middleware");
const create_chat_1 = require("../controllers/chat/create-chat");
const get_chats_1 = require("../controllers/chat/get-chats");
const get_chat_by_id_1 = require("../controllers/chat/get-chat-by-id");
const create_message_1 = require("../controllers/chat/create-message");
const get_messages_1 = require("../controllers/chat/get-messages");
const search_users_1 = require("../controllers/chat/search-users");
const search_users_algolia_1 = require("../controllers/chat/search-users-algolia");
exports.chatRouter = (0, express_1.Router)();
// Apply authentication middleware to all chat routes
exports.chatRouter.use(middleware_1.verify);
// Chat routes
exports.chatRouter.post("/create", create_chat_1.createChat);
exports.chatRouter.get("/", get_chats_1.getChats);
exports.chatRouter.get("/:chatId", get_chat_by_id_1.getChatById);
exports.chatRouter.post("/:chatId/messages", create_message_1.createMessage);
exports.chatRouter.get("/:chatId/messages", get_messages_1.getMessages);
exports.chatRouter.get("/search/users", search_users_1.searchUsers);
exports.chatRouter.get("/search/algolia", search_users_algolia_1.searchUsersAlgolia);
