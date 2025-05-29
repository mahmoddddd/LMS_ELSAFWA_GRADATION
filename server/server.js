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



// //initaialize express
// const app = express();

// // Middleware

// app.use(cors());
// app.use(clerkMiddleware())
// app.use((req, res, next) => {
//   console.log(req.originalUrl);
//   if (req.originalUrl === '/stripe') {
//     console.log(req.originalUrl ,"aaaa");
//     next();
//   }else{
//     next();
//   }
// });


// //connect to datbase
// await connectDB()
// await connectCloudinary()

// // Root Route
// app.get("/", (req, res) => {
//   res.send("🎉v1 MERN Backend is Running...");
// });

// app.post('/clerk',express.json(), clerkWebHooks)
// app.use('/api/educator',express.json(), educateRouter)
// app.use('/api/course',express.json(), courseRouter)
// app.use('/api/user',express.json(), userRouter)
// app.post('/stripe',express.raw({type:'application/json'}), stripewebhooks)

// // port
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config'
import connectDB from "./configs/mongodb.js";
import { clerkWebHooks, stripewebhooks } from "./controllers/webhooks.js";
import educateRouter from "./routes/educatorRouters.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(clerkMiddleware());
app.use((req, res, next) => {
  console.log(req.originalUrl);
  next();
});

// Connect to database and cloudinary
await connectDB();
await connectCloudinary();

// Routes
app.get("/", (req, res) => {
  res.send("🎉v1 MERN Backend is Running...");
});

app.post('/clerk', express.json(), clerkWebHooks);
app.use('/api/educator', express.json(), educateRouter);
app.use('/api/course', express.json(), courseRouter);
app.use('/api/user', express.json(), userRouter);
app.post('/stripe', express.raw({ type: 'application/json' }), stripewebhooks);

// ❌ DON'T use app.listen in Vercel
// ✅ Instead, export the app
export default app;
