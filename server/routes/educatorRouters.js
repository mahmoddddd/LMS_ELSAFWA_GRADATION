import express from "express";

import {
  updateRoleToEducator,
  addCourse,
  educatorDashboardData,
  getEducatorCourses,
  getEnrolledStudentsData,
  uploadLectureVideo,
  getCourseById,
  updateCourse,
  addLectureToCourse,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleWare.js";

const educateRouter = express.Router();

//add educator role
educateRouter.get("/update-role", (req, res, next) => {
  console.log("Got a request on /update-role");
  next();
}, updateRoleToEducator);

educateRouter.get("/courses", getEducatorCourses);
educateRouter.get("/dashboard",educatorDashboardData);
educateRouter.get("/enrolled-students",protectEducator, getEnrolledStudentsData);
educateRouter.post("/add-course", protectEducator,upload.single("image"), addCourse);
educateRouter.post(
  "/upload-lecture-video",
  protectEducator,
  upload.single("video"),
  uploadLectureVideo
);

// Course editing routes
educateRouter.get("/course/:courseId", protectEducator, getCourseById);
educateRouter.put("/course/:courseId", protectEducator, upload.single("image"), updateCourse);
educateRouter.post("/course/:courseId/chapter/:chapterId/lecture", protectEducator, upload.single("video"), addLectureToCourse);

export default educateRouter;
