import express from "express";
import {
  createPaymentSession,
  handleSuccessfulPayment,
} from "../controllers/paymentController.js";
import { authenticateUser } from "../middlewares/authMiddleWare.js";

const router = express.Router();

// Create payment session
router.post("/create-session", authenticateUser, createPaymentSession);

// Handle successful payment
router.post(
  "/handle-payment-success",
  authenticateUser,
  handleSuccessfulPayment
);

export default router;
