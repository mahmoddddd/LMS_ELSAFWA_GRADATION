import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config"; // لتحميل متغيرات البيئة من .env
import connectDB from "./configs/mongodb.js";
import { clerkWebHooks, stripewebhooks } from "./controllers/webhooks.js";
import educateRouter from "./routes/educatorRouters.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// إنشاء تطبيق Express
const app = express();

// ✅ طباعة المفتاح للتأكد من وجوده (احذفها في الإنتاج)
// console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);
// console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY);

// ✅ Middleware: Clerk
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

// CORS
app.use(cors());

// تسجيل كل الطلبات للديباج
app.use((req, res, next) => {
  console.log("Request to:", req.originalUrl);
  next();
});

// ✅ اتصال بقاعدة البيانات و Cloudinary
await connectDB();
await connectCloudinary();

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ المسارات (routes)
app.get("/", (req, res) => {
  res.send("🎉 v1 MERN Backend is Running...");
});

app.post("/clerk", express.raw({ type: "application/json" }), clerkWebHooks);
app.use(express.json());
app.use("/api/educator", educateRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// Stripe Webhook requires raw body
app.post("/stripe", express.raw({ type: "application/json" }), stripewebhooks);

// ✅ لا تستخدم app.listen() مع Vercel
// ❗ مهم: صدّر `app` بدلًا من تشغيل السيرفر
export default app;
