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
    const origin = req.headers.origin || "http://localhost:5173";
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
        await processSuccessfulPayment(session);
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

    // Start a transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Update purchase status
      purchase.status = "completed";
      await purchase.save({ session: dbSession });

      // Get user and course
      const user = await User.findOne({
        clerkId: session.metadata.clerkUserId,
      });
      const course = await Course.findById(session.metadata.courseId);

      if (!user || !course) {
        throw new Error("User or course not found");
      }

      // Add course to user's enrolled courses if not already enrolled
      if (!user.enrolledCourses.includes(course._id)) {
        user.enrolledCourses.push(course._id);
        await user.save({ session: dbSession });
      }

      // Add user to course's enrolled students if not already enrolled
      if (!course.enrolledStudents.includes(user._id)) {
        course.enrolledStudents.push(user._id);
        await course.save({ session: dbSession });
      }

      // Commit the transaction
      await dbSession.commitTransaction();
      console.log("✅ Transaction committed successfully");

      res.json({
        success: true,
        message: "Payment processed successfully",
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error("❌ Error processing payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

// Helper function for webhook handler
async function processSuccessfulPayment(session) {
  try {
    console.log("🔄 Processing successful payment from webhook:", {
      sessionId: session.id,
      metadata: session.metadata,
    });

    // Get purchase record
    const purchase = await Purchase.findById(session.metadata.purchaseId);
    if (!purchase) {
      throw new Error(`Purchase not found: ${session.metadata.purchaseId}`);
    }

    if (purchase.status === "completed") {
      console.log("ℹ️ Purchase already completed:", purchase._id);
      return;
    }

    // Start a transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Update purchase status
      purchase.status = "completed";
      await purchase.save({ session: dbSession });

      // Get user and course
      const user = await User.findOne({
        clerkId: session.metadata.clerkUserId,
      });
      const course = await Course.findById(session.metadata.courseId);

      if (!user || !course) {
        throw new Error("User or course not found");
      }

      // Add course to user's enrolled courses if not already enrolled
      if (!user.enrolledCourses.includes(course._id)) {
        user.enrolledCourses.push(course._id);
        await user.save({ session: dbSession });
      }

      // Add user to course's enrolled students if not already enrolled
      if (!course.enrolledStudents.includes(user._id)) {
        course.enrolledStudents.push(user._id);
        await course.save({ session: dbSession });
      }

      // Commit the transaction
      await dbSession.commitTransaction();
      console.log("✅ Transaction committed successfully");
    } catch (error) {
      // If an error occurred, abort the transaction
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error("❌ Error processing payment from webhook:", error);
    throw error;
  }
}

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
