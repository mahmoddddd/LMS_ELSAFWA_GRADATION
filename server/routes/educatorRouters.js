import express from 'express'
import {addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator} from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleWare.js'

const educateRouter =express.Router()

//add educator role

educateRouter.get('/update-role',updateRoleToEducator)
educateRouter.get('/courses',getEducatorCourses)
educateRouter.get('/dashboard',educatorDashboardData)
educateRouter.get('/enrolled-students',getEnrolledStudentsData)
educateRouter.post('/add-course',upload.single('image'),addCourse)


export default educateRouter;