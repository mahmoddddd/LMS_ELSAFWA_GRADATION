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
import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// Clerk Webhook
export const clerkWebHooks = async (req, res) => {
  try {
    console.log("➡️ Clerk Webhook hit");

    const payload = req.body;
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers); // payload لازم يكون raw Buffer

    console.log("✅ Webhook verified successfully");

    const { data, type } = evt;

    console.log("📨 Clerk event type:", type);
    console.log("📊 Event data:", JSON.stringify(data, null, 2));

    if (type === "user.created") {
      const existingUser = await User.findById(data.id);
      if (existingUser) {
        console.log("⚠️ User already exists:", existingUser._id);
        return res.status(200).json({ success: true, message: "User already exists" });
      }

      const userToCreate = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        imageUrl: data.image_url,
      };

      console.log("📝 Creating user:", userToCreate);

      const newUser = await User.create(userToCreate);
      console.log("📦 Saved user to DB:", newUser);

      console.log("✅ User created successfully");
    } else {
      console.log("⚠️ Event type not handled:", type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripewebhooks = async (req, res) => {
  console.log("📩 Stripe Webhook hit");
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe Webhook verification failed:", err.message);
    res.status(460).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      if (!session.data.length) {
        return res.status(400).json({ message: "❌ No session found for paymentIntent" });
      }

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      const userData = await User.findById(purchaseData.userId);
      const courseData = await Course.findById(purchaseData.courseId.toString());

      // Add user to course and course to user
      courseData.enrolledStudents.push(userData);
      await courseData.save();

      userData.enrolledCourses.push(courseData._id);
      await userData.save();

      purchaseData.status = "completed";
      await purchaseData.save();

      console.log("✅ Purchase completed and user enrolled");
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      if (!session.data.length) {
        return res.status(400).json({ message: "❌ No session found for paymentIntent" });
      }

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = "failed";
      await purchaseData.save();

      console.log("⚠️ Payment failed, status updated");
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
