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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signinController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken_1 = require("./generateAccessToken");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const signinController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User does not exist.",
            });
            return;
        }
        const isValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({
                success: false,
                code: "PASSWORD_INCORRECT",
                message: "Incorrect password.",
            });
            return;
        }
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret", { expiresIn: "24h" });
        const accessToken = (0, generateAccessToken_1.generateAccessToken)(user.id.toString());
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.status(200).json({
            success: true,
            code: "SIGNED_IN",
            message: "User signed in successfully.",
            data: userWithoutPassword,
            tokens: { accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error.",
        });
    }
});
exports.signinController = signinController;
