import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserCredits,
  getUserStats,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

// All user routes require authentication
router.use(protect);

// GET /api/users/profile - Get current user profile
router.get("/profile", getUserProfile);

// PUT /api/users/profile - Update user profile
router.put("/profile", updateUserProfile);

// GET /api/users/credits - Get user credits
router.get("/credits", getUserCredits);

// GET /api/users/stats - Get user statistics
router.get("/stats", getUserStats);

export default router;
