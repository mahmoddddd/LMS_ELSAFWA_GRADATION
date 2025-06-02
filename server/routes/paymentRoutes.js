import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createPaymentSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// إنشاء جلسة دفع
router.post("/create-session", authenticate, createPaymentSession);

// معالجة webhook من Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
