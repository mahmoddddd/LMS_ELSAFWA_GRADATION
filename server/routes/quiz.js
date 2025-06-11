import express from "express";
import {
  createQuiz,
  getCourseQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getStudentSubmission,
  getStudentProgress,
  getStudentSubmissionHistory,
  checkSubmissionEligibility,
  getQuizStatistics,
  getQuizLeaderboard,
  getStudentAnalytics,
  uploadQuestionFile,
  uploadAnswerFile,
  gradeFileSubmission,
  gradeSubmission,
  getSubmissionDetails,
} from "../controllers/QuizController.js";
import { protectEducator } from "../middlewares/authMiddleware.js";
import multer from "multer";
import cloudinary from "cloudinary";
import Quiz from "../models/Quiz.js";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only PDF and Word documents are allowed.")
      );
    }
  },
});

// Middleware to handle file upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "LMS_ELSAFWA/quiz_files",
      resource_type: "auto", // 👈 خليه auto
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    });

    req.file.path = result.secure_url;
    req.file.filename = result.public_id;

    // استخدام الرابط الصحيح من Cloudinary
    const publicUrl = cloudinary.v2.url(result.public_id, {
      secure: true,
      resource_type: "raw",
      type: "upload",
    });
    console.log("Cloudinary upload result:", {
      public_id: result.public_id,
      url: publicUrl,
      format: result.format,
    });

    req.file.path = publicUrl;
    req.file.filename = result.public_id;
    req.file.originalname = req.file.originalname;
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    next(error);
  }
};

const router = express.Router();

// Educator routes
router.post(
  "/",
  protectEducator,
  upload.single("quizFile"),
  uploadToCloudinary,
  createQuiz
);
router.get("/instructor/:instructorId", protectEducator, async (req, res) => {
  try {
    const { instructorId } = req.params;
    const quizzes = await Quiz.find({ instructor: instructorId })
      .populate("course", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error("Error fetching instructor quizzes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put("/:id", protectEducator, updateQuiz);
router.delete("/:id", protectEducator, deleteQuiz);
router.get("/:id/statistics", protectEducator, getQuizStatistics);
router.post(
  "/:quizId/questions/:questionId/file",
  protectEducator,
  upload.single("file"),
  uploadToCloudinary,
  uploadQuestionFile
);
router.post(
  "/:quizId/submissions/:submissionId/answers/:answerId/grade",
  protectEducator,
  gradeFileSubmission
);
router.post(
  "/:quizId/submissions/:studentId/grade",
  protectEducator,
  gradeSubmission
);
router.get(
  "/:quizId/submissions/:studentId",
  protectEducator,
  getSubmissionDetails
);

// Student routes
router.get("/course/:courseId", getCourseQuizzes);
router.get("/course/:courseId/progress", getStudentProgress);
router.get("/course/:courseId/analytics", getStudentAnalytics);
router.post("/:id/submit", submitQuiz);
router.post(
  "/:quizId/questions/:questionId/answer",
  upload.single("file"),
  uploadToCloudinary,
  uploadAnswerFile
);
router.get("/:id/submission", getStudentSubmission);
router.get("/:id/submission-history", getStudentSubmissionHistory);
router.get("/:id/check-eligibility", checkSubmissionEligibility);
router.get("/:id/leaderboard", getQuizLeaderboard);
router.get("/:id", getQuiz);

export default router;
