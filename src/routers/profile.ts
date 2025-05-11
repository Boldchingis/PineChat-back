import express from "express";
import { createProfile, updateProfile } from "../controllers/profile/create-profile";
import { getProfile } from "../controllers/profile/get-profile";
import { verify } from "../middleware";

const router = express.Router();

router.use(verify);
router.post("/create", createProfile);
router.get("/", getProfile);
router.put("/update", updateProfile);

export default router;
