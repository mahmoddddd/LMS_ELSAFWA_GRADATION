import express from "express";
import {
  getAllCourse,
  getCourseId,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../configs/multer.js";

const router = express.Router();

// Get all courses
router.get("/", getAllCourse);

// Get course by ID
router.get("/:courseId", getCourseId);

// Update course (protected route)
router.put("/:courseId", verifyToken, upload.single("thumbnail"), updateCourse);

// Delete course (protected route)
router.delete("/:courseId", verifyToken, deleteCourse);

export default router;
