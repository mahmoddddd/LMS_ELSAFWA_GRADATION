import express from "express";
import { protectEducator } from "../middlewares/authMiddleWare.js";

import {
  addCourse,
  educatorDashboardData,
  getEducatorCourses,
  getEnrolledStudentsData,
  updateRoleToEducator,
  uploadLectureVideo,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleWare.js";

const educateRouter = express.Router();

//add educator role
educateRouter.use(protectEducator) 
educateRouter.get("/update-role", updateRoleToEducator);
educateRouter.get("/courses", getEducatorCourses);
educateRouter.get("/dashboard", educatorDashboardData);
educateRouter.get("/enrolled-students", getEnrolledStudentsData);
educateRouter.post("/add-course", upload.single("image"), addCourse);
educateRouter.post(
  "/upload-lecture-video",
  protectEducator,
  upload.single("video"),
  uploadLectureVideo
);

export default educateRouter;
