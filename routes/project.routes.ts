import { Router } from "express";
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  getPublicProjects,
  togglePublishProject,
} from "../controllers/project.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.js";
import {
  validateCreateProject,
  validateUpdateProject,
} from "../validators/project.validator.js";

const router = Router();

// Public routes
// GET /api/projects/public - Get all published projects (community page)
router.get("/public", getPublicProjects);

// Protected routes
// POST /api/projects - Create a new project
router.post("/", protect, validateCreateProject, createProject);

// GET /api/projects/my - Get user's projects
router.get("/my", protect, getUserProjects);

// GET /api/projects/:projectId - Get project by ID
router.get("/:projectId", optionalAuth, getProjectById);

// PUT /api/projects/:projectId - Update project
router.put("/:projectId", protect, validateUpdateProject, updateProject);

// DELETE /api/projects/:projectId - Delete project
router.delete("/:projectId", protect, deleteProject);

// PATCH /api/projects/:projectId/publish - Toggle publish status
router.patch("/:projectId/publish", protect, togglePublishProject);

export default router;
