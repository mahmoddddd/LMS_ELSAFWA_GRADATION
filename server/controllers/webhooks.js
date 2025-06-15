// import { Webhook } from "svix";
// import User from "../models/User.js";
// import Stripe from "stripe";
// import { Purchase } from "../models/Purchase.js";
// import Course from "../models/Course.js";

// //API controller function to manage clerk user with datab

// export const clerkWebHooks = async (req, res) => {
//   try {
//     console.log("➡️ Clerk Webhook hit");

//     // log headers
//     console.log("🔐 Headers received:");
//     console.log("svix-id:", req.headers["svix-id"]);
//     console.log("svix-timestamp:", req.headers["svix-timestamp"]);
//     console.log("svix-signature:", req.headers["svix-signature"]);

//     // log raw body (important)
//     console.log("📦 Raw payload (should be a Buffer):", req.body);

//     const payload = req.body;
//     const headers = {
//       "svix-id": req.headers["svix-id"],
//       "svix-timestamp": req.headers["svix-timestamp"],
//       "svix-signature": req.headers["svix-signature"],
//     };

//     const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
//     const evt = wh.verify(payload, headers); // ⚠️ payload لازم يكون raw Buffer

//     console.log("✅ Webhook verified successfully");

//     const { data, type } = evt;

//     console.log("📨 Clerk event type:", type);
//     console.log("📊 Event data:", JSON.stringify(data, null, 2));

//     if (type === "user.created") {
//       const newUser = await User.create({
//   _id: data.id,
//   email: data.email_addresses[0].email_address,
//   name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
//   imageUrl: data.image_url,
// });
// console.log("📦 Saved user to DB:", newUser);

//       const userToCreate = {
//         _id: data.id,
//         email: data.email_addresses[0].email_address,
//         name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
//         imageUrl: data.image_url,
//       };

//       console.log("📝 Creating user:", userToCreate);

//       await User.create(userToCreate);

//       console.log("✅ User created successfully");
//     } else {
//       console.log("⚠️ Event type not handled:", type);
//     }

//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("❌ Webhook error:", error.message);
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
// export const stripewebhooks = async (request, response) => {
//   console.log("stripewebhooks");
//   const sig = request.headers["stripe-signature"];

//   let event;

//   try {
//     event = Stripe.webhooks.constructEvent(
//       request.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     response.status(460).send(`webhook Error: ${err.message}`);
//   }
//   // Handle the event
//   switch (event.type) {
//     case "payment_intent.succeeded": {
//       const paymentIntent = event.data.object;
//       const paymentIntentId = paymentIntent.id;
//       const session = await stripeInstance.checkout.sessions.list({
//         payment_intent: paymentIntentId,
//       });
//       const { purchaseId } = session.data[0].metadata;

//       const purchaseData = await Purchase.findById(purchaseId);

//       const userData = await User.findById(purchaseData.userId);

//       const courseData = await Course.findById(
//         purchaseData.courseId.toString()
//       );
//       courseData.enrolledStudents.push(userData);

//       await courseData.save();
//       console.log(courseData, "courseData");
//       userData.enrolledCourses.push(courseData._id);

//       await userData.save();

//       purchaseData.status = "completed";
//       await purchaseData.save();

//       break;
//     }
//     case "payment_intent.payment_failed":
//       const paymentIntent = event.data.object;
//       const paymentIntentId = paymentIntent.id;
//       const session = await stripeInstance.checkout.sessions.list({
//         payment_intent: paymentIntentId,
//       });
//       const { purchaseId } = session.data[0].metadata;
//       const purchaseData = await Purchase.findById(purchaseId);
//       purchaseData.status = "failed";
//       await purchaseData.save();

//       break;

//     // ... handle other event types

//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }
//   response.json({ received: true });
// };

import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/clerk-sdk-node"; // تأكد إنك منصبه
import mongoose from "mongoose";

export const clerkWebHooks = async (req, res) => {
  try {
    console.log("➡️ Clerk Webhook hit");

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(req.body, headers);

    const { data, type } = evt;

    console.log("📨 Clerk event type:", type);

    if (type === "user.created") {
      if (!data.id) {
        return res
          .status(400)
          .json({ success: false, message: "Missing Clerk user ID" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ clerkId: data.id });
      if (existingUser) {
        console.log("⚠️ User already exists:", existingUser._id);
        return res.status(200).json({ success: true });
      }

      console.log("🆔 Clerk user ID from webhook:", data.id);

      // Get user data from Clerk
      const clerkUser = await clerkClient.users.getUser(data.id);

      // Create user object with fallback values
      const userToCreate = {
        clerkId: clerkUser.id,
        _id: clerkUser.id,
        email:
          clerkUser.emailAddresses[0]?.emailAddress ||
          `${clerkUser.id}@placeholder.com`,
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "New User",
        imageUrl:
          clerkUser.imageUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${clerkUser.id}`,
        role: "student", // Default role
      };

      // Validate required fields
      if (!userToCreate.email || !userToCreate.name || !userToCreate.imageUrl) {
        console.error(
          "❌ Missing required fields for user creation:",
          userToCreate
        );
        return res.status(400).json({
          success: false,
          message: "Missing required fields for user creation",
        });
      }

      try {
        const newUser = await User.create(userToCreate);
        console.log("✅ User created successfully:", newUser._id);
        return res.status(200).json({ success: true, user: newUser });
      } catch (error) {
        console.error("❌ Error creating user:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create user",
          error: error.message,
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Clerk Webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stripe
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// ===== Stripe webhook handler =====
export const stripeWebhooks = async (req, res) => {
  console.log("🔔 Stripe webhook received");
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ Missing stripe signature");
    return res.status(400).json({
      success: false,
      message: "Missing stripe signature",
    });
  }

  let event;
  try {
    console.log("🔐 Verifying webhook signature");
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook signature verified");
    console.log("📦 Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      console.log("🔄 Processing checkout.session.completed event");
      const session = event.data.object;
      console.log("Session metadata:", session.metadata);

      const { purchaseId, clerkUserId, courseId } = session.metadata;
      console.log("Extracted metadata:", { purchaseId, clerkUserId, courseId });

      if (!purchaseId || !clerkUserId || !courseId) {
        console.error("❌ Missing required metadata");
        return res.status(400).json({
          success: false,
          message: "Missing required metadata",
        });
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        console.error("❌ Purchase not found:", purchaseId);
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      if (purchase.status === "completed") {
        console.log("ℹ️ Purchase already completed:", purchaseId);
        return res.json({
          success: true,
          message: "Purchase already completed",
        });
      }

      const user = await User.findOne({ clerkId: clerkUserId });
      const course = await Course.findById(courseId);

      if (!user || !course) {
        console.error("❌ User or course not found");
        return res.status(404).json({
          success: false,
          message: "User or course not found",
        });
      }

      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Add user to course's enrolled students
          if (!course.enrolledStudents.includes(user.clerkId)) {
            course.enrolledStudents.push(user.clerkId);
            await course.save({ session });
          }

          // Add course to user's enrolled courses
          if (!user.enrolledCourses.includes(course._id)) {
            user.enrolledCourses.push(course._id);
            await user.save({ session });
          }

          // Update purchase status
          purchase.status = "completed";
          purchase.completedAt = new Date();
          await purchase.save({ session });

          await session.commitTransaction();
          console.log(
            "✅ Successfully processed payment and updated enrollment"
          );
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }

        res.json({
          success: true,
          message: "Payment processed successfully",
        });
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({
          success: false,
          message: "Failed to process payment",
          error: error.message,
        });
      }
    } else if (event.type === "payment_intent.succeeded") {
      console.log("🔄 Processing payment_intent.succeeded event");
      const paymentIntent = event.data.object;

      // Get the session associated with this payment intent
      const sessions = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      if (!sessions.data.length) {
        console.error(
          "❌ No sessions found for payment intent:",
          paymentIntent.id
        );
        return res.status(404).json({
          success: false,
          message: "No session found for payment intent",
        });
      }

      const session = sessions.data[0];
      const { purchaseId, clerkUserId, courseId } = session.metadata;

      if (!purchaseId || !clerkUserId || !courseId) {
        console.error("❌ Missing required metadata");
        return res.status(400).json({
          success: false,
          message: "Missing required metadata",
        });
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        console.error("❌ Purchase not found:", purchaseId);
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      if (purchase.status === "completed") {
        console.log("ℹ️ Purchase already completed:", purchaseId);
        return res.json({
          success: true,
          message: "Purchase already completed",
        });
      }

      const user = await User.findOne({ clerkId: clerkUserId });
      const course = await Course.findById(courseId);

      if (!user || !course) {
        console.error("❌ User or course not found");
        return res.status(404).json({
          success: false,
          message: "User or course not found",
        });
      }

      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Add user to course's enrolled students
          if (!course.enrolledStudents.includes(user.clerkId)) {
            course.enrolledStudents.push(user.clerkId);
            await course.save({ session });
          }

          // Add course to user's enrolled courses
          if (!user.enrolledCourses.includes(course._id)) {
            user.enrolledCourses.push(course._id);
            await user.save({ session });
          }

          // Update purchase status
          purchase.status = "completed";
          purchase.completedAt = new Date();
          await purchase.save({ session });

          await session.commitTransaction();
          console.log(
            "✅ Successfully processed payment and updated enrollment"
          );
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }

        res.json({
          success: true,
          message: "Payment processed successfully",
        });
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({
          success: false,
          message: "Failed to process payment",
          error: error.message,
        });
      }
    } else if (event.type === "payment_intent.payment_failed") {
      console.log("🔄 Processing payment_intent.payment_failed event");
      const paymentIntent = event.data.object;

      const sessions = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      if (!sessions.data.length) {
        console.error(
          "❌ No sessions found for payment intent:",
          paymentIntent.id
        );
        return res.status(404).json({
          success: false,
          message: "No session found for payment intent",
        });
      }

      const session = sessions.data[0];
      const { purchaseId } = session.metadata;

      if (!purchaseId) {
        console.error("❌ Missing purchaseId in metadata");
        return res.status(400).json({
          success: false,
          message: "Missing purchaseId in metadata",
        });
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        console.error("❌ Purchase not found:", purchaseId);
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      purchase.status = "failed";
      await purchase.save();
      console.log("✅ Updated purchase status to failed");

      res.json({
        success: true,
        message: "Purchase marked as failed",
      });
    } else {
      console.log("ℹ️ Unhandled event type:", event.type);
      res.json({ received: true });
    }
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};
