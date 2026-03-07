import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import {
  getUserProfile,
  updateUserProfile,
  getUserCredits,
  getUserStats,
  getAllProjects,
  getProjectById,
  toggleProjectPublish,
} from "../controller/user.controller.js";

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

// GET /api/users/projects - Get all projects user has access to
router.get("/projects", getAllProjects);

// GET /api/users/projects/:id - Get project by id
router.get("/projects/:id", getProjectById);

// POST /api/users/projects/:id/toggle - Publish / unpublish project publicly
router.post("/projects/:id/toggle", toggleProjectPublish);

export default router;
