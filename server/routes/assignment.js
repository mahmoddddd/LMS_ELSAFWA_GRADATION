// import express from "express";
// import {
//   createAssignment,
//   getCourseAssignments,
//   getAssignment,
//   updateAssignment,
//   deleteAssignment,
//   submitAssignment,
//   getStudentSubmission,
//   getStudentProgress,
//   getStudentSubmissionHistory,
//   checkSubmissionEligibility,
// } from "../controllers/AssignmentController.js";
// import { protectEducator } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // Educator routes
// router.post("/", protectEducator, createAssignment);
// router.get("/course/:courseId", getCourseAssignments);
// router.get("/:id", getAssignment);
// router.put("/:id", protectEducator, updateAssignment);
// router.delete("/:id", protectEducator, deleteAssignment);

// // Student routes
// router.post("/:id/submit", submitAssignment);
// router.get("/:id/submission", getStudentSubmission);
// router.get("/course/:courseId/progress", getStudentProgress);
// router.get("/:id/submission-history", getStudentSubmissionHistory);
// router.get("/:id/check-eligibility", checkSubmissionEligibility);

// export default router;
