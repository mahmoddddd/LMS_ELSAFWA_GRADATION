import express from "express";
import {
  addUserRating,
  getUserCourseProgress,
  getUserData,
  purchaseCourse,
  updateUserCourseProgress,
  userEnrolledCourses,
  checkEnrollmentStatus,
  syncUserRole,
  getUserFullData,
  handleSuccessfulPayment,
  completePurchase,
  updatePurchaseClerkId,
} from "../controllers/userController.js";
// import { requireAuth } from "../middlewares/authMiddleWare.js"

const userRouter = express.Router();

// User data routes
userRouter.get("/data", getUserData);
userRouter.get("/full-data", getUserFullData);
userRouter.get("/enrolled-courses", userEnrolledCourses);
userRouter.post("/sync-role", syncUserRole); // ✅ Route جديد

// Course progress routes
userRouter.post("/get-course-progress", getUserCourseProgress);
userRouter.post("/update-course-progress", updateUserCourseProgress);

// Enrollment routes
userRouter.get("/enrollment-status/:courseId", checkEnrollmentStatus);
userRouter.post("/purchase", purchaseCourse);
userRouter.get("/handle-successful-payment", handleSuccessfulPayment);
userRouter.post("/complete-purchase/:purchaseId", completePurchase); // manual
userRouter.post("/update-purchase-clerk-id", updatePurchaseClerkId);

export default userRouter;
