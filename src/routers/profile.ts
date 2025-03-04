// routes/profile.ts
import express from "express";
import { createProfile } from "../controllers/profile/create-profile";

const router = express.Router();

// Route to create profile
router.post("/create-profile", createProfile);

export default router;
