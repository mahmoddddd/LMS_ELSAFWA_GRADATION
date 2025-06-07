import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Stripe from "stripe";
import { CourseProgress } from "../models/courseProgress.js";
import Course from "../models/Course.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { extractClerkUserId } from "../utils/verifyClerkToken.js";

// ✅ Function to sync Clerk metadata with database role
export const syncUserRole = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { role } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!role || !["student", "educator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    console.log(`✅ Synced Clerk metadata for user ${userId} with role: ${role}`);
    res.json({ success: true, message: "Role synchronized successfully" });
  } catch (error) {
    console.error("❌ Error syncing role:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserFullData = async (req, res) => {
  try {
    const clerkId = extractClerkUserId(req.headers.authorization);
    const userId = req.auth;
    console.log("auth userId", userId);

    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized: Clerk ID not found" });

    const user = await User.findOne({ clerkId }).populate("enrolledCourses").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserFullData:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    extractClerkUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("🔍 Getting user data for:", userId);
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User Not Found in db" });

    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const clerkRole = clerkUser.publicMetadata?.role;
      const dbRole = user.role;

      if (clerkRole !== dbRole) {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: { role: dbRole },
        });
      }
    } catch (clerkError) {
      console.error("⚠️ Warning: Could not sync Clerk role:", clerkError.message);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error getting user data:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    extractClerkUserId(req.headers.authorization);
   const userData = await User.findOne({ clerkId: userId }).populate({
      path: "enrolledCourses",
      populate: { path: "educator", select: "name email imageUrl" },
    });
    if (!userData) return res.status(404).json({ success: false, message: "User Not Found" });

    const enrolledCourses = await Course.find({
      _id: { $in: userData.enrolledCourses },
    }).populate("educator", "name email imageUrl");

    res.json({ success: true, enrolledCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.status(404).json({ success: false, message: "Data Not Found" });
    }

    const amount = (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2);
    const newPurchase = await Purchase.create({ courseId: courseData._id, userId, amount });

    userData.enrolledCourses.push(courseData._id);
    await userData.save();

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: courseData.courseTitle },
            unit_amount: Math.floor(newPurchase.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { purchaseId: newPurchase._id.toString() },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({ success: true, message: 'Lecture Already Completed' });
      }
      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        completed: true,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: 'Progress Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });
    res.json({ success: true, progressData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addUserRating = async (req, res) => {
  const userId = req.auth.userId;
  const { courseId, rating } = req.body;

  if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: 'Invalid Details' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.json({ success: false, message: 'Course not found.' });

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.json({ success: false, message: 'User has not purchased this course.' });
    }

    const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);
    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();
    res.json({ success: true, message: 'Rating added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
