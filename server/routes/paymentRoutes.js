import express from "express";
import { 
  createPaymentSession, 
  handleStripeWebhook 
} from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Payment session route
router.post("/create-session", requireAuth, createPaymentSession);

// Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;