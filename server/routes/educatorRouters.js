import express from "express";

import {
  updateRoleToEducator,
  addCourse,
  educatorDashboardData,
  getEducatorCourses,
  getEnrolledStudentsData,
  uploadLectureVideo,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleWare.js";

const educateRouter = express.Router();

//add educator role
educateRouter.get("/update-role", updateRoleToEducator);
educateRouter.get("/courses",protectEducator, getEducatorCourses);
educateRouter.get("/dashboard", protectEducator,educatorDashboardData);
educateRouter.get("/enrolled-students",protectEducator, getEnrolledStudentsData);
educateRouter.post("/add-course", protectEducator,upload.single("image"), addCourse);
educateRouter.post(
  "/upload-lecture-video",
  protectEducator,
  upload.single("video"),
  uploadLectureVideo
);

export default educateRouter;
