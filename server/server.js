import express from "express";

import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebHooks, stripeWebhooks } from "./controllers/webhooks.js";
import educateRouter from "./routes/educatorRouters.js";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import chatbotRouter from "./routes/chatbotRoute.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";
import contactUs from "./routes/subscribeRoutes.js";
import quizRouter from "./routes/quiz.js";
// import assignmentRouter from "./routes/assignment.js";

const app = express();

// Enable CORS first
app.use(cors({ origin: "*" }));

// تسجيل الطلبات للدباج
app.use((req, res, next) => {
  console.log("Request to:", req.originalUrl);
  next();
});

// اتصال بالداتا بيز وCloudinary
await connectDB();
await connectCloudinary();

// Stripe webhook (raw body)
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Clerk webhook (raw body) - 👈 لازم يجي قبل express.json()
app.post("/clerk", express.raw({ type: "application/json" }), clerkWebHooks);

// 👇 JSON parser ييجي بعد الراوتات اللي محتاجة raw
app.use(express.json());

// Apply Clerk authentication to all routes except webhooks
app.use((req, res, next) => {
  if (req.path === "/stripe" || req.path === "/clerk") {
    return next();
  }
  return ClerkExpressWithAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
    onError: (err, req, res) => {
      console.error("Clerk auth error:", err);
      res.status(401).json({ success: false, message: "Unauthorized" });
    },
  })(req, res, next);
});

// باقي الروترات
app.use("/api/educator", educateRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/subscribe", subscribeRoutes);
app.use("/api/cont", contactUs);
app.use("/api/quiz", quizRouter);

// نقطة الدخول الرئيسية
app.get("/", (req, res) => {
  res.send("Your API Is Working");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const port = 4000;
// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
// // لا تستخدم app.listen في Vercel
// // export default app;
