import express from "express";
import { requireAuth } from "../middlewares/authMiddleWare.js";
import {
  createPaymentSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// الجلسة لازم مستخدم يكون مسجل دخول
router.post("/create-session", requireAuth, createPaymentSession);

// Webhook متساب مفتوح عشان Stripe يقدر يتواصل معاه
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;