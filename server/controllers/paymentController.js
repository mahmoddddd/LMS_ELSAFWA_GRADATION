import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2023-10-16" 
});

export const createPaymentSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const [userData, courseData] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId)
    ]);

    if (!userData || !courseData) {
      return res.status(404).json({ 
        success: false, 
        message: "User or Course not found" 
      });
    }

    // Check if already enrolled
    if (userData.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ 
        success: false, 
        message: "User already enrolled in this course" 
      });
    }

    const amount = (courseData.coursePrice - 
                  (courseData.discount * courseData.coursePrice / 100))
                  .toFixed(2);

    const newPurchase = await Purchase.create({ 
      courseId: courseData._id, 
      userId, 
      amount, 
      status: "pending" 
    });

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
     success_url: `${origin}/loading/my-enrollments`, 
      //success_url: `${origin}/my-enrollments?complete_purchase=true&purchase_id=${newPurchase._id}`,

      cancel_url: `${origin}/courses/${courseId}`,
      customer_email: userData.email,
      client_reference_id: userId,
      line_items: [{
        price_data: {
          currency: process.env.CURRENCY.toLowerCase(),
          product_data: { 
            name: courseData.courseTitle,
            description: courseData.courseDescription.substring(0, 100),
            images: [courseData.courseThumbnail]
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: { 
        purchaseId: newPurchase._id.toString(),
        courseId: courseId,
        userId: userId.toString()
      }
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      sessionUrl: session.url 
    });

  } catch (error) {
    console.error('Payment session error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleSuccessfulPayment(session);
        break;
      
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object;
        await handleFailedPayment(paymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

async function handleSuccessfulPayment(session) {
  const { purchaseId } = session.metadata;
  
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) {
    throw new Error(`Purchase not found: ${purchaseId}`);
  }

  if (purchase.status === 'completed') {
    return; // Already processed
  }

  const [user, course] = await Promise.all([
    User.findById(purchase.userId),
    Course.findById(purchase.courseId)
  ]);

  if (!user || !course) {
    throw new Error('User or Course not found');
  }

  // Add to enrolled courses if not already enrolled
  if (!user.enrolledCourses.includes(purchase.courseId)) {
    user.enrolledCourses.push(purchase.courseId);
  }

  // Add to enrolled students if not already added
  if (!course.enrolledStudents.includes(purchase.userId)) {
    course.enrolledStudents.push(purchase.userId);
  }

  purchase.status = 'completed';
  purchase.paidAt = new Date();

  await Promise.all([
    user.save(),
    course.save(),
    purchase.save()
  ]);
}

async function handleFailedPayment(paymentIntent) {
  const sessions = await stripeInstance.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1
  });

  if (sessions.data.length === 0) return;

  const { purchaseId } = sessions.data[0].metadata;
  const purchase = await Purchase.findById(purchaseId);

  if (purchase && purchase.status !== 'completed') {
    purchase.status = 'failed';
    await purchase.save();
  }
}