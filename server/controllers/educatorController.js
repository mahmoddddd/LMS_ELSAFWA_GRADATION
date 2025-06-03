import { clerkClient } from "@clerk/express";
 
import Course from "../models/Course.js";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { v2 as cloudinary } from "cloudinary";
 
// Update user role to educator (Clerk + MongoDB)

export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ تحقق لو المستخدم educator بالفعل
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser && existingUser.role === "educator") {
      return res.json({
        success: true,
        message: "You are already an educator",
        user: existingUser,
      });
    }

    // Update Clerk public metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    console.log("✅ Updated Clerk metadata for user:", userId);

    // Update MongoDB user role
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { role: "educator" },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    console.log("✅ Updated database role for user:", userId);

    res.json({
      success: true,
      message: "You can publish a course now",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Role update error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}
//add new course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imagefile = req.file;
    const educatorId = req.auth.userId;

    if (!imagefile) {
      return res.json({ success: false, message: "thumbnail not attached" });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(imagefile.buffer).toString("base64");
    const dataURI = `data:${imagefile.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto",
    });

    const parseCoursedata = JSON.parse(courseData);
    parseCoursedata.educator = educatorId;
    parseCoursedata.courseThumbnail = imageUpload.secure_url;

    const newCourse = await Course.create(parseCoursedata);
    res.json({ success: true, message: "course added" });
  } catch (error) {
    console.error("Error adding course:", error);
    res.json({ success: false, message: error.message });
  }
};

//get educator courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//educator dashboard
export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const totalcourses = courses.length;
    const courseIds = courses.map((course) => course._id);

    //calculate total earnings from purchases
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Collect unique enrolled student IDs with their course titles
    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        {
          _id: { $in: course.enrolledStudents },
        },
        "name imageUrl"
      );
      students.forEach((student) => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalcourses,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const courseIds = courses.map((course) => course._id);
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
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

// Upload lecture video
export const uploadLectureVideo = async (req, res) => {
  try {
    const videoFile = req.file;
    if (!videoFile) {
      return res.json({ success: false, message: "No video file attached" });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(videoFile.buffer).toString("base64");
    const dataURI = `data:${videoFile.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      resource_type: "video",
      chunk_size: 6000000, // 6MB chunks for better upload
      eager: [{ format: "mp4", quality: "auto" }],
      eager_async: true,
    });

    res.json({
      success: true,
      videoUrl: uploadResult.secure_url,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    console.error("Video upload error:", error);
    res.json({
      success: false,
      message: error.message || "Error uploading video",
    });
  }
};
