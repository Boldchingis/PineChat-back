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
exports.fetchUsers = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const generateAccessToken_1 = require("./generateAccessToken");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const saltRounds = 10;
const isUserExist = (field) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.user.findUnique({ where: field });
});
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    try {
        const existingUser = yield isUserExist({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                code: "USER_ALREADY_EXISTS",
                message: "User already exists",
            });
            return;
        }
        const hashedPass = yield bcrypt_1.default.hash(password, saltRounds);
        const newUser = yield prisma.user.create({
            data: {
                email,
                password: hashedPass,
                name,
                profile: {
                    create: {
                        image: "",
                        about: "",
                    },
                },
            },
        });
        // Handle JWT Token creation
        const refreshToken = jsonwebtoken_1.default.sign({ userId: newUser.id }, process.env.REFRESH_TOKEN_SECRET || "default_secret", { expiresIn: "24h" });
        const accessToken = (0, generateAccessToken_1.generateAccessToken)(newUser.id.toString());
        res.status(201).json({
            success: true,
            code: "SUCCESS",
            message: "User created successfully",
            data: { id: newUser.id, email: newUser.email, name: newUser.name },
            tokens: { accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.createUser = createUser;
const fetchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: { id: true, email: true, name: true },
        });
        res.json({
            success: true,
            code: "FETCH_SUCCESS",
            message: "Users fetched successfully",
            data: users,
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.fetchUsers = fetchUsers;
