import express from 'express'
import { addUserRating, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses,checkEnrollmentStatus ,syncUserRole } from '../controllers/userController.js'
// import { requireAuth } from "../middlewares/authMiddleWare.js"


const userRouter =express.Router()

userRouter.get('/data', getUserData)
userRouter.post('/sync-role', syncUserRole); // ✅ Route جديد

userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)
userRouter.get('/enrollment-status/:courseId', checkEnrollmentStatus);
export default userRouter;