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
exports.searchUsersAlgolia = void 0;
const algolia_1 = __importDefault(require("../../services/algolia"));
const searchUsersAlgolia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        const userId = req.userId;
        if (!query || typeof query !== 'string') {
            res.status(400).json({
                success: false,
                code: "INVALID_QUERY",
                message: "Search query is required",
            });
            return;
        }
        // Search users in Algolia, excluding the current user
        const results = yield algolia_1.default.searchUsers(query, userId);
        res.status(200).json({
            success: true,
            code: "USERS_FOUND",
            message: "Users found successfully",
            data: results,
        });
    }
    catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.searchUsersAlgolia = searchUsersAlgolia;
