import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import mongoose from "mongoose";
import { clerkClient } from "@clerk/clerk-sdk-node";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const createPaymentSession = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.user;

    console.log("🔄 Creating payment session for:", {
      courseId,
      userId,
    });

    // Get user data from Clerk
    const userData = await clerkClient.users.getUser(userId);
    if (!userData) {
      console.error("❌ User not found in Clerk:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get course data
    const courseData = await Course.findById(courseId);
    if (!courseData) {
      console.error("❌ Course not found:", courseId);
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Calculate amount
    const amount = courseData.price;
    console.log("💰 Amount to charge:", amount);

    // Create purchase record
    const newPurchase = await Purchase.create({
      course: courseId,
      user: userId,
      amount: amount,
      status: "pending",
    });

    console.log("✅ Created purchase record:", {
      purchaseId: newPurchase._id,
      courseId,
      userId,
      amount,
    });

    // Get origin for success/cancel URLs
    const origin = req.headers.origin || "http://localhost:3000";
    console.log("🌐 Origin for URLs:", origin);

    // Create Stripe checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${origin}/loading/my-enrollments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/courses/${courseId}`,
      customer_email: userData.email,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: process.env.CURRENCY.toLowerCase(),
            product_data: {
              name: courseData.courseTitle,
              images: [courseData.courseThumbnail],
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchaseId: newPurchase._id.toString(),
        courseId: courseId,
        userId: userId.toString(),
        clerkUserId: userData.clerkId,
      },
    });

    console.log("✅ Created Stripe session:", {
      sessionId: session.id,
      metadata: session.metadata,
    });

    res.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("❌ Error creating payment session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment session",
      error: error.message,
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await handleSuccessfulPayment(session);
        break;

      case "payment_intent.payment_failed":
        const paymentIntent = event.data.object;
        await handleFailedPayment(paymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleSuccessfulPayment = async (req, res) => {
  try {
    const { session_id } = req.body;
    const { userId } = req.user;

    console.log("🔄 Handling successful payment:", {
      sessionId: session_id,
      userId,
    });

    // Verify the session
    const session = await stripeInstance.checkout.sessions.retrieve(session_id);
    console.log("✅ Retrieved session:", {
      sessionId: session.id,
      metadata: session.metadata,
    });

    if (!session) {
      console.error("❌ Session not found:", session_id);
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Get purchase record
    const purchase = await Purchase.findById(session.metadata.purchaseId);
    if (!purchase) {
      console.error("❌ Purchase not found:", session.metadata.purchaseId);
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (purchase.status === "completed") {
      console.log("ℹ️ Purchase already completed:", purchase._id);
      return res.json({
        success: true,
        message: "Purchase already completed",
      });
    }

    // Get user and course
    const user = await User.findOne({ clerkId: session.metadata.clerkUserId });
    const course = await Course.findById(session.metadata.courseId);

    if (!user || !course) {
      console.error("❌ User or course not found:", {
        userId: session.metadata.clerkUserId,
        courseId: session.metadata.courseId,
        userFound: !!user,
        courseFound: !!course,
      });
      return res.status(404).json({
        success: false,
        message: "User or course not found",
      });
    }

    try {
      const dbSession = await mongoose.startSession();
      dbSession.startTransaction();
      console.log("🔄 Started MongoDB transaction");

      try {
        // Add user to course's enrolled students if not already added
        if (!course.enrolledStudents.includes(user.clerkId)) {
          course.enrolledStudents.push(user.clerkId);
          await course.save({ session: dbSession });
          console.log("✅ Added user to course students:", {
            userId: user._id,
            clerkId: user.clerkId,
            courseId: course._id,
          });
        }

        // Add course to user's enrolled courses if not already added
        if (!user.enrolledCourses.includes(course._id)) {
          user.enrolledCourses.push(course._id);
          await user.save({ session: dbSession });
          console.log("✅ Added course to user enrollments:", {
            userId: user._id,
            clerkId: user.clerkId,
            courseId: course._id,
          });
        }

        // Update purchase status
        purchase.status = "completed";
        purchase.completedAt = new Date();
        await purchase.save({ session: dbSession });
        console.log("✅ Updated purchase status to completed");

        await dbSession.commitTransaction();
        console.log("✅ Successfully committed enrollment transaction");
      } catch (error) {
        console.error("❌ Error in transaction:", error);
        await dbSession.abortTransaction();
        throw error;
      } finally {
        dbSession.endSession();
        console.log("🔄 Ended MongoDB session");
      }

      res.json({
        success: true,
        message: "Enrollment completed successfully",
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
    res.status(500).json({
      success: false,
      message: "Failed to handle successful payment",
      error: error.message,
    });
  }
};

async function handleFailedPayment(paymentIntent) {
  const sessions = await stripeInstance.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  if (sessions.data.length === 0) return;

  const { purchaseId } = sessions.data[0].metadata;
  const purchase = await Purchase.findById(purchaseId);

  if (purchase && purchase.status !== "completed") {
    purchase.status = "failed";
    await purchase.save();
  }
}
