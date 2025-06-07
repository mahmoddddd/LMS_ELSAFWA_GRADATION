import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Stripe from "stripe";
import { CourseProgress } from "../models/courseProgress.js";
import Course from "../models/Course.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { extractClerkUserId } from "../utils/verifyClerkToken.js";
import mongoose from "mongoose";

// ✅ Function to sync Clerk metadata with database role
export const syncUserRole = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { role } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!role || !["student", "educator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    console.log(
      `✅ Synced Clerk metadata for user ${userId} with role: ${role}`
    );
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

    if (!clerkId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Clerk ID not found" });

    const user = await User.findOne({ clerkId })
      .populate("enrolledCourses")
      .lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

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
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("🔍 Getting user data for:", userId);
    const user = await User.findOne({ clerkId: userId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found in db" });

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
      console.error(
        "⚠️ Warning: Could not sync Clerk role:",
        clerkError.message
      );
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
    if (!userData)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });

    const enrolledCourses = await Course.find({
      _id: { $in: userData.enrolledCourses },
    }).populate("educator", "name email imageUrl");

    res.json({ success: true, enrolledCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== FIXED PURCHASE COURSE FUNCTION =====
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;

    // Extract Clerk user ID from token
    const clerkUserId = extractClerkUserId(req.headers.authorization);
    if (!clerkUserId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid token" });
    }

    console.log("📝 Starting purchase process:", { courseId, clerkUserId });

    // Find user by clerkId
    const userData = await User.findOne({ clerkId: clerkUserId });
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      console.error("❌ User or course not found:", {
        userFound: !!userData,
        courseFound: !!courseData,
      });
      return res
        .status(404)
        .json({ success: false, message: "User or Course not found" });
    }

    // Check if user is already enrolled
    if (userData.enrolledCourses.includes(courseData._id)) {
      console.log("ℹ️ User already enrolled in course");
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const amount = (
      courseData.coursePrice -
      (courseData.discount * courseData.coursePrice) / 100
    ).toFixed(2);

    // Create purchase record with status 'pending'
    const newPurchase = await Purchase.create({
      courseId: courseData._id,
      userId: userData._id,
      clerkId: clerkUserId,
      amount,
      status: "pending",
    });

    console.log("✅ Created purchase record:", {
      purchaseId: newPurchase._id,
      userId: userData._id,
      clerkId: clerkUserId,
      courseId: courseData._id,
      amount,
    });

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = (process.env.CURRENCY || "USD").toLowerCase();

    // Create Stripe session with metadata
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/course/${courseId}`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: courseData.courseTitle,
              description:
                courseData.courseDescription?.slice(0, 100) || "Online Course",
            },
            unit_amount: Math.floor(newPurchase.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
        userId: userData._id.toString(),
        clerkUserId: clerkUserId,
        courseId: courseData._id.toString(),
      },
      customer_email: userData.email,
      payment_intent_data: {
        metadata: {
          purchaseId: newPurchase._id.toString(),
          userId: userData._id.toString(),
          clerkUserId: clerkUserId,
          courseId: courseData._id.toString(),
        },
      },
    });

    console.log("✅ Created Stripe session:", {
      sessionId: session.id,
      purchaseId: newPurchase._id,
      userId: userData._id,
      clerkId: clerkUserId,
      courseId: courseData._id,
      metadata: session.metadata,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("❌ Purchase course error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new endpoint to handle successful payment
export const handleSuccessfulPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    console.log("🔄 Processing successful payment for session:", session_id);

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(session_id);

    if (!session) {
      console.error("❌ Session not found:", session_id);
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    const { purchaseId, clerkUserId } = session.metadata;
    console.log("📝 Processing purchase:", { purchaseId, clerkUserId });

    const purchaseData = await Purchase.findById(purchaseId);
    if (!purchaseData) {
      console.error("❌ Purchase not found:", purchaseId);
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    if (purchaseData.status === "completed") {
      console.log("ℹ️ Payment already processed for purchase:", purchaseId);
      return res.json({ success: true, message: "Payment already processed" });
    }

    // Find user by clerkId
    const userData = await User.findOne({ clerkId: clerkUserId });
    const courseData = await Course.findById(purchaseData.courseId);

    if (!userData || !courseData) {
      console.error("❌ User or course not found:", {
        clerkUserId,
        courseId: purchaseData.courseId,
        userFound: !!userData,
        courseFound: !!courseData,
      });
      return res
        .status(404)
        .json({ success: false, message: "User or course not found" });
    }

    try {
      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      console.log("🔄 Started MongoDB transaction");

      try {
        // Add user to course's enrolled students if not already added
        if (!courseData.enrolledStudents.includes(userData.clerkId)) {
          courseData.enrolledStudents.push(userData.clerkId);
          await courseData.save({ session });
          console.log("✅ Added user to course students:", {
            userId: userData._id,
            clerkId: userData.clerkId,
            courseId: courseData._id,
            updatedEnrolledStudents: courseData.enrolledStudents,
          });
        }

        // Add course to user's enrolled courses if not already added
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save({ session });
          console.log("✅ Added course to user enrollments:", {
            userId: userData._id,
            clerkId: userData.clerkId,
            courseId: courseData._id,
            updatedEnrolledCourses: userData.enrolledCourses,
          });
        }

        // Update purchase status
        purchaseData.status = "completed";
        purchaseData.completedAt = new Date();
        await purchaseData.save({ session });
        console.log("✅ Updated purchase status to completed");

        // Commit the transaction
        await session.commitTransaction();
        console.log("✅ Successfully committed enrollment transaction");
      } catch (error) {
        console.error("❌ Error in transaction:", error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
        console.log("🔄 Ended MongoDB session");
      }

      res.json({
        success: true,
        message: "Enrollment completed successfully",
        redirectUrl: "http://localhost:5173/my-enrollments?refresh=true",
      });
    } catch (error) {
      console.error("❌ Error in enrollment transaction:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process enrollment",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("❌ Error handling successful payment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== HELPER FUNCTION TO CHECK ENROLLMENT STATUS =====
export const checkEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const clerkUserId = extractClerkUserId(req.headers.authorization);

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userData = await User.findOne({ clerkId: clerkUserId });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isEnrolled = userData.enrolledCourses.includes(courseId);

    res.json({
      success: true,
      isEnrolled,
      enrolledCourses: userData.enrolledCourses,
    });
  } catch (error) {
    console.error("❌ Error checking enrollment status:", error);
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
        return res.json({
          success: true,
          message: "Lecture Already Completed",
        });
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

    res.json({ success: true, message: "Progress Updated" });
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
    return res.json({ success: false, message: "Invalid Details" });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course)
      return res.json({ success: false, message: "Course not found." });

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.json({
        success: false,
        message: "User has not purchased this course.",
      });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );
    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();
    res.json({ success: true, message: "Rating added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    console.log("🔄 Manually completing purchase:", purchaseId);

    // Extract clerkId from authorization header
    const clerkId = extractClerkUserId(req.headers.authorization);
    if (!clerkId) {
      console.error("❌ No clerkId found in authorization header");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No clerkId found",
      });
    }

    console.log("🔑 Extracted clerkId from token:", clerkId);

    const purchaseData = await Purchase.findById(purchaseId);
    if (!purchaseData) {
      console.error("❌ Purchase not found:", purchaseId);
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    console.log("📝 Found purchase data:", {
      id: purchaseData._id,
      clerkId: purchaseData.clerkId,
      courseId: purchaseData.courseId,
      status: purchaseData.status,
    });

    if (purchaseData.status === "completed") {
      console.log("ℹ️ Purchase already completed:", purchaseId);
      return res.json({
        success: true,
        message: "Purchase already completed",
        redirectUrl: "http://localhost:5173/my-enrollments?refresh=true",
      });
    }

    // Update purchase with clerkId if it's not set
    if (!purchaseData.clerkId) {
      console.log("📝 Updating purchase with clerkId:", clerkId);
      purchaseData.clerkId = clerkId;
      await purchaseData.save();
    }

    // Find user and course
    const userData = await User.findOne({ clerkId: clerkId });
    console.log("🔍 Looking for user with clerkId:", clerkId);
    console.log(
      "📝 User data found:",
      userData
        ? {
            id: userData._id,
            clerkId: userData.clerkId,
            email: userData.email,
          }
        : "Not found"
    );

    const courseData = await Course.findById(purchaseData.courseId);
    console.log("🔍 Looking for course with ID:", purchaseData.courseId);
    console.log(
      "📝 Course data found:",
      courseData
        ? {
            id: courseData._id,
            title: courseData.courseTitle,
          }
        : "Not found"
    );

    if (!userData || !courseData) {
      console.error("❌ User or course not found:", {
        clerkId: clerkId,
        courseId: purchaseData.courseId,
        userFound: !!userData,
        courseFound: !!courseData,
      });
      return res.status(404).json({
        success: false,
        message: "User or course not found",
        details: {
          clerkId: clerkId,
          courseId: purchaseData.courseId,
          userFound: !!userData,
          courseFound: !!courseData,
        },
      });
    }

    try {
      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      console.log("🔄 Started MongoDB transaction");

      try {
        // Add user to course's enrolled students if not already added
        if (!courseData.enrolledStudents.includes(userData.clerkId)) {
          courseData.enrolledStudents.push(userData.clerkId);
          await courseData.save({ session });
          console.log("✅ Added user to course students:", {
            userId: userData._id,
            clerkId: userData.clerkId,
            courseId: courseData._id,
            updatedEnrolledStudents: courseData.enrolledStudents,
          });
        }

        // Add course to user's enrolled courses if not already added
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save({ session });
          console.log("✅ Added course to user enrollments:", {
            userId: userData._id,
            clerkId: userData.clerkId,
            courseId: courseData._id,
            updatedEnrolledCourses: userData.enrolledCourses,
          });
        }

        // Update purchase status
        purchaseData.status = "completed";
        purchaseData.completedAt = new Date();
        await purchaseData.save({ session });
        console.log("✅ Updated purchase status to completed");

        // Commit the transaction
        await session.commitTransaction();
        console.log("✅ Successfully committed enrollment transaction");
      } catch (error) {
        console.error("❌ Error in transaction:", error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
        console.log("🔄 Ended MongoDB session");
      }

      res.json({
        success: true,
        message: "Purchase completed successfully",
        redirectUrl: "http://localhost:5173/my-enrollments?refresh=true",
      });
    } catch (error) {
      console.error("❌ Error in enrollment transaction:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process enrollment",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("❌ Error completing purchase:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePurchaseClerkId = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({
        success: false,
        message: "clerkId is required",
      });
    }

    console.log("🔄 Updating purchase clerkId:", { purchaseId, clerkId });

    const purchaseData = await Purchase.findById(purchaseId);
    if (!purchaseData) {
      console.error("❌ Purchase not found:", purchaseId);
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // Update the clerkId
    purchaseData.clerkId = clerkId;
    await purchaseData.save();

    console.log("✅ Updated purchase clerkId:", {
      purchaseId: purchaseData._id,
      clerkId: purchaseData.clerkId,
      courseId: purchaseData.courseId,
    });

    res.json({
      success: true,
      message: "Purchase updated successfully",
      purchase: purchaseData,
    });
  } catch (error) {
    console.error("❌ Error updating purchase:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
