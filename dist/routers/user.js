"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const create_user_1 = require("../controllers/user/create-user");
const sign_in_1 = require("../controllers/user/sign-in");
const forgot_password_1 = require("../controllers/forgot-password/forgot-password");
const reset_password_1 = require("../controllers/user/reset-password");
exports.userRouter = (0, express_1.Router)();
// User routes
exports.userRouter.post("/sign-in", sign_in_1.signinController);
exports.userRouter.post("/forgot-password", forgot_password_1.forgotPassword);
exports.userRouter.post("/reset-password", reset_password_1.resetPassword);
exports.userRouter.post("/create-user", create_user_1.createUser);
