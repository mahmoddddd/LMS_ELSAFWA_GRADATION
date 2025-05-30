import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

//API controller function to manage clerk user with datab
export const clerkWebHooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // لازم نمرر body كـ buffer أو string
    const payload = req.body; // raw body من express.raw
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // التحقق من صحة ال webhook
    const evt = whook.verify(payload, headers);

    const { data, type } = evt;

    switch (type) {
      case "user.created":
        await User.create({
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        });
        break;

      case "user.updated":
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        });
        break;

      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;

      default:
        console.log("Unhandled event", type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
export const stripewebhooks = async (request, response) => {
  console.log("stripewebhooks");
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    response.status(460).send(`webhook Error: ${err.message}`);
  }
  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId);

      const userData = await User.findById(purchaseData.userId);

      const courseData = await Course.findById(
        purchaseData.courseId.toString()
      );
      courseData.enrolledStudents.push(userData);

      await courseData.save();
      console.log(courseData, "courseData");
      userData.enrolledCourses.push(courseData._id);

      await userData.save();

      purchaseData.status = "completed";
      await purchaseData.save();

      break;
    }
    case "payment_intent.payment_failed":
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = "failed";
      await purchaseData.save();

      break;

    // ... handle other event types

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  response.json({ received: true });
};
