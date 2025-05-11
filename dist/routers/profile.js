"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/profile.ts
const express_1 = __importDefault(require("express"));
const create_profile_1 = require("../controllers/profile/create-profile");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all profile routes
router.use(middleware_1.verify);
// Profile routes
router.post("/create", create_profile_1.createProfile);
router.get("/", create_profile_1.getProfile);
router.put("/update", create_profile_1.updateProfile);
exports.default = router;
