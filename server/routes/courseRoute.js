import express from "express";
import { getAllCourse, getCourseId } from "../controllers/courseController.js";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";

const courseRouter = express.Router();

// Apply Clerk authentication to all routes
courseRouter.use(
  ClerkExpressWithAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
    onError: (err, req, res) => {
      console.error("Clerk auth error:", err);
      res.status(401).json({ success: false, message: "Unauthorized" });
    },
  })
);

courseRouter.get("/all", getAllCourse);
courseRouter.get("/:id", getCourseId);

export default courseRouter;
