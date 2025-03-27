"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/profile.ts
const express_1 = __importDefault(require("express"));
const create_profile_1 = require("../controllers/profile/create-profile");
const router = express_1.default.Router();
// Route to create profile
router.post("/create-profile", create_profile_1.createProfile);
exports.default = router;
