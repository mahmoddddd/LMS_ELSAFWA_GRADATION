import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebHooks, stripeWebhooks } from "./controllers/webhooks.js";
import educateRouter from "./routes/educatorRouters.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

// Clerk middleware
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

app.use(cors({ origin: "*" }));

// تسجيل الطلبات للدباج
app.use((req, res, next) => {
  console.log("Request to:", req.originalUrl);
  next();
});

// اتصال بالداتا بيز وCloudinary
await connectDB();
await connectCloudinary();

// لازم express.json() قبل باقي الروترات
app.use(express.json());

// مسارات api
app.use("/api/educator", educateRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// نقطة الدخول الرئيسية
app.get("/", (req, res) => {
  res.send("Your API Is Working");
});

// Stripe webhook (raw body)
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Clerk webhook (json)
app.post("/clerk", express.json(), clerkWebHooks);

// لا تستخدم app.listen في Vercel
export default app;
