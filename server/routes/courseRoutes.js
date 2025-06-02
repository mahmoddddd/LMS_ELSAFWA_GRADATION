import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = express.Router();

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourseById);

// Protected routes
router.post("/", authenticate, authorize(["educator"]), createCourse);
router.put("/:id", authenticate, authorize(["educator"]), updateCourse);
router.delete("/:id", authenticate, authorize(["educator"]), deleteCourse);

export default router;
