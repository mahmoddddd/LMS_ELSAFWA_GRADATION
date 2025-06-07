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



// ===== FIXED PURCHASE COURSE FUNCTION =====
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    
    // Extract Clerk user ID from token
    const clerkUserId = extractClerkUserId(req.headers.authorization);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // Find user by clerkId
    const userData = await User.findOne({ clerkId: clerkUserId });
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.status(404).json({ success: false, message: "User or Course not found" });
    }

    // Check if user is already enrolled
    if (userData.enrolledCourses.includes(courseData._id)) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
    }

    const amount = (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2);
    
    // Create purchase record with status 'pending'
    const newPurchase = await Purchase.create({ 
      courseId: courseData._id, 
      userId: userData._id, // MongoDB user ID
      amount,
      status: 'pending' // Set initial status as pending
    });

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = (process.env.CURRENCY || 'USD').toLowerCase();

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/course/${courseId}`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { 
              name: courseData.courseTitle,
              description: courseData.courseDescription?.slice(0, 100) || 'Online Course'
            },
            unit_amount: Math.floor(newPurchase.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { 
        purchaseId: newPurchase._id.toString(),
        userId: userData._id.toString(),
        courseId: courseData._id.toString(),
        clerkUserId: clerkUserId // Add clerk ID for reference
      },
      customer_email: userData.email,
    });

    // DON'T add to enrolledCourses here - wait for webhook confirmation
    console.log(`✅ Created purchase ${newPurchase._id} for user ${userData._id} and course ${courseData._id}`);
    
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("❌ Purchase course error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== FIXED STRIPE WEBHOOK HANDLER =====
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log('✅ Processing checkout.session.completed event');
        const session = event.data.object;
        const { purchaseId, userId, courseId } = session.metadata;

        if (!purchaseId || !userId || !courseId) {
          console.error('❌ Missing metadata in session:', session.metadata);
          return res.status(400).send("Missing required metadata");
        }

        // Find the purchase record
        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.error('❌ Purchase not found:', purchaseId);
          return res.status(404).send("Purchase not found");
        }

        // Check if already processed
        if (purchaseData.status === "completed") {
          console.log('✅ Purchase already completed:', purchaseId);
          return res.json({ received: true });
        }

        // Find user and course
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        if (!userData || !courseData) {
          console.error('❌ User or course not found:', { userId, courseId });
          return res.status(404).send("User or course not found");
        }

        // Add course to user's enrolled courses if not already enrolled
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save();
          console.log('✅ Added course to user enrollments:', { userId, courseId });
        }

        // Add user to course's enrolled students if not already added
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
          console.log('✅ Added user to course students:', { userId, courseId });
        }

        // Mark purchase as completed
        purchaseData.status = "completed";
        purchaseData.completedAt = new Date();
        await purchaseData.save();

        console.log('✅ Successfully processed enrollment:', { 
          purchaseId, 
          userId, 
          courseId, 
          userEmail: userData.email 
        });

        break;
      }

      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        console.log('❌ Processing payment failure event');
        const session = event.data.object;
        const { purchaseId } = session.metadata || {};

        if (purchaseId) {
          const purchaseData = await Purchase.findById(purchaseId);
          if (purchaseData) {
            purchaseData.status = "failed";
            purchaseData.failedAt = new Date();
            await purchaseData.save();
            console.log('✅ Marked purchase as failed:', purchaseId);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error handling Stripe webhook event:', error);
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isEnrolled = userData.enrolledCourses.includes(courseId);
    
    res.json({ 
      success: true, 
      isEnrolled,
      enrolledCourses: userData.enrolledCourses 
    });
  } catch (error) {
    console.error('❌ Error checking enrollment status:', error);
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
