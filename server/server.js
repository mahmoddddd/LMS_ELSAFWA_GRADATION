// // import express from "express";
// // import cors from "cors";
// // import mongoose from "mongoose";
// // import 'dotenv/config'
// // import connectDB from "./configs/mongodb.js";
// // import { clerkWebHooks, stripewebhooks } from "./controllers/webhooks.js";
// // import educateRouter from "./routes/educatorRouters.js";
// // import { clerkMiddleware } from "@clerk/express";
// // import connectCloudinary from "./configs/cloudinary.js";
// // import courseRouter from "./routes/courseRoute.js";
// // import userRouter from "./routes/userRoutes.js";



// // //initaialize express
// // const app = express();

// // // Middleware

// // app.use(cors());
// // app.use(clerkMiddleware())

// // app.use((req, res, next) => {
// //   console.log(req.originalUrl);
// //   if (req.originalUrl === '/stripe') {
// //     console.log(req.originalUrl ,"aaaa");
// //     next();
// //   }else{
// //     next();
// //   }
// // });


// // //connect to datbase
// // await connectDB()
// // await connectCloudinary()

// // // Root Route
// // app.get("/", (req, res) => {
// //   res.send("🎉v1 MERN Backend is Running...");

// // });

// // app.post('/clerk',express.json(), clerkWebHooks)
// // app.use('/api/educator',express.json(), educateRouter)
// // app.use('/api/course',express.json(), courseRouter)
// // app.use('/api/user',express.json(), userRouter)
// // app.post('/stripe',express.raw({type:'application/json'}), stripewebhooks)





// // // port
// // const PORT = process.env.PORT || 3000;
// // app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ///////////////////////////////////////////

// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import 'dotenv/config'
// import connectDB from "./configs/mongodb.js";
// import { clerkWebHooks, stripewebhooks } from "./controllers/webhooks.js";
// import educateRouter from "./routes/educatorRouters.js";
// import { clerkMiddleware } from "@clerk/express";
// import connectCloudinary from "./configs/cloudinary.js";
// import courseRouter from "./routes/courseRoute.js";
// import userRouter from "./routes/userRoutes.js";

// const app = express();

// // Middleware
// app.use(cors());
// app.use(clerkMiddleware());
// console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);

// app.use((req, res, next) => {
//   console.log(req.originalUrl);
//   next();
// });
// //
// // Connect to database and cloudinary
// await connectDB();
// await connectCloudinary();

// // Routes
// app.get("/", (req, res) => {
//   res.send("🎉v1 MERN Backend is Running...");
// });

// app.post('/clerk', express.json(), clerkWebHooks);
// app.use('/api/educator', express.json(), educateRouter);
// app.use('/api/course', express.json(), courseRouter);
// app.use('/api/user', express.json(), userRouter);
// app.post('/stripe', express.raw({ type: 'application/json' }), stripewebhooks);

// // ❌ DON'T use app.listen in Vercel
// // ✅ Instead, export the app
// export default app;


// server.js أو index.js

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config'; // لتحميل متغيرات البيئة من .env
import connectDB from "./configs/mongodb.js";
import { clerkWebHooks, stripewebhooks } from "./controllers/webhooks.js";
import educateRouter from "./routes/educatorRouters.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

// إنشاء تطبيق Express
const app = express();

// ✅ طباعة المفتاح للتأكد من وجوده (احذفها في الإنتاج)
console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY);

// ✅ Middleware: Clerk
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

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

// ✅ المسارات (routes)
app.get("/", (req, res) => {
  res.send("🎉 v1 MERN Backend is Running...");
});

app.post('/clerk', express.json(), clerkWebHooks);
app.use('/api/educator', express.json(), educateRouter);
app.use('/api/course', express.json(), courseRouter);
app.use('/api/user', express.json(), userRouter);

// Stripe Webhook requires raw body
app.post('/stripe', express.raw({ type: 'application/json' }), stripewebhooks);

// ✅ لا تستخدم app.listen() مع Vercel
// ❗ مهم: صدّر `app` بدلًا من تشغيل السيرفر
export default app;
