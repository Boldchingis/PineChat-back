"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verify = (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
        res.status(401).send("Access Denied. No token provided");
        return;
    }
    try {
        jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        next();
    }
    catch (error) {
        if (!refreshToken) {
            res.status(401).send("Access Denied. No refresh token provided.");
        }
        res.status(400).send("Invalid Token");
    }
};
exports.verify = verify;
