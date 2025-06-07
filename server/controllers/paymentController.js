import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

// إنشاء جلسة الدفع
export const createPaymentSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    
    // userId من req.auth.userId لو مش حابب تستخدم requireAuth ممكن تعدل لاحقًا
    const userId = req.auth?.userId || req.body.userId; // لو بعت userId في البودي بدل التوكن

    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.status(404).json({ success: false, message: "User or Course Not Found" });
    }

    // حساب السعر بعد الخصم
    const amount = (courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2);

    // إنشاء سجل شراء جديد بحالة pending
    const newPurchase = await Purchase.create({ courseId: courseData._id, userId, amount, status: "pending" });

    const currency = process.env.CURRENCY.toLowerCase();

    // انشاء جلسة شوب آوت
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: courseData.courseTitle },
            unit_amount: Math.floor(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { purchaseId: newPurchase._id.toString() },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// معالجة Webhook من Stripe
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

        if (!sessions.data.length) {
          console.error("No session found for payment intent:", paymentIntentId);
          break;
        }

        const { purchaseId } = sessions.data[0].metadata;

        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.error("Purchase not found:", purchaseId);
          break;
        }

        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
          console.error("User or Course not found for Purchase:", purchaseId);
          break;
        }

        // أضف المستخدم لقائمة الطلاب بالكورس لو مش موجود
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
        }

        // أضف الكورس لقائمة الكورسات المسجلة للمستخدم لو مش موجود
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save();
        }

        // حدّث حالة الشراء لـ completed
        purchaseData.status = "completed";
        await purchaseData.save();

        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

        if (!sessions.data.length) {
          console.error("No session found for payment intent:", paymentIntentId);
          break;
        }

        const { purchaseId } = sessions.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId);

        if (purchaseData) {
          purchaseData.status = "failed";
          await purchaseData.save();
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook event:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
