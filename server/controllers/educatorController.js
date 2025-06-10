// Updated Educator Controller with Clerk Token Extraction
import { clerkClient } from "@clerk/clerk-sdk-node";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/courseProgress.js";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
import { extractClerkUserId } from "../utils/verifyClerkToken.js";

// Update user role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = extractClerkUserId(req.headers.authorization);
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser?.role === "educator") {
      return res.json({
        success: true,
        message: "You are already an educator",
        user: existingUser,
      });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "educator" },
    });

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { role: "educator" },
      { new: true }
    );

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "You can publish a course now",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCourse = async (req, res) => {
  try {
    const educatorId = extractClerkUserId(req.headers.authorization);
    const { courseData } = req.body;
    const imagefile = req.file;

    if (!educatorId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!imagefile)
      return res.json({ success: false, message: "Thumbnail not attached" });

    const b64 = Buffer.from(imagefile.buffer).toString("base64");
    const dataURI = `data:${imagefile.mimetype};base64,${b64}`;
    const imageUpload = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto",
    });

    const parsedCourseData = JSON.parse(courseData);
    parsedCourseData.educator = educatorId;
    parsedCourseData.courseThumbnail = imageUpload.secure_url;

    await Course.create(parsedCourseData);
    res.json({ success: true, message: "Course added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getEducatorCourses = async (req, res) => {
  try {
    const clerkId = extractClerkUserId(req.headers.authorization);
    if (!clerkId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // ⛏️ نجيب بيانات المدرّس من اليوزر
    const educator = await User.findOne({ clerkId });
    if (!educator)
      return res
        .status(404)
        .json({ success: false, message: "Educator not found" });

    // ✅ استخدم _id بتاع المدرّس
    const courses = await Course.find({ educator: educator._id });

    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const educatorDashboardData = async (req, res) => {
  try {
    const educator = extractClerkUserId(req.headers.authorization);
    if (!educator)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const courses = await Course.find({ educator });
    const totalcourses = courses.length;
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });
    const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);

    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        { _id: { $in: course.enrolledStudents } },
        "name imageUrl"
      );
      students.forEach((student) => {
        enrolledStudentsData.push({ courseTitle: course.courseTitle, student });
      });
    }

    res.json({
      success: true,
      dashboardData: { totalEarnings, enrolledStudentsData, totalcourses },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educatorId = req.auth.userId; // هنا ناخذ الـ ObjectId مباشرة من الـ auth middleware
    if (!educatorId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // جلب كورسات المعلم
    const courses = await Course.find({ educator: educatorId });
    const courseIds = courses.map((course) => course._id);

    // جلب عمليات الشراء المكتملة
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl") // userId هنا ObjectId، لذلك populate يعمل بشكل صحيح
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const uploadLectureVideo = async (req, res) => {
  try {
    const videoFile = req.file;
    if (!videoFile)
      return res.json({ success: false, message: "No video file attached" });

    const b64 = Buffer.from(videoFile.buffer).toString("base64");
    const dataURI = `data:${videoFile.mimetype};base64,${b64}`;
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      resource_type: "video",
      chunk_size: 6000000,
      eager: [{ format: "mp4", quality: "auto" }],
      eager_async: true,
    });

    res.json({
      success: true,
      videoUrl: uploadResult.secure_url,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
