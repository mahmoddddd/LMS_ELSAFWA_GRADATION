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
import { protectEducator } from "../middlewares/authMiddleWare.js";
import multer from "multer";
import cloudinary from "cloudinary";
import Quiz from "../models/Quiz.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

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
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      access_mode: "public",
      type: "upload",
      format: "pdf",
      display_name: req.file.originalname,
      allowed_formats: ["pdf"],
      tags: ["quiz", "pdf"],
      access_control: [
        {
          access_type: "anonymous",
          start: new Date(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // استخدام الرابط المباشر من نتيجة الرفع
    req.file.path = result.secure_url;
    req.file.filename = result.public_id;
    req.file.originalname = req.file.originalname;

    console.log("Cloudinary upload result:", {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      access_mode: result.access_mode,
    });

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
router.post("/:quizId/submit", submitQuiz);
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

// Get student quiz analytics
router.get("/student/:studentId/analytics", async (req, res) => {
  try {
    const { studentId } = req.params;
    const quizzes = await Quiz.find({
      "submissions.student": studentId,
    }).populate({
      path: "course",
      select: "courseTitle educator",
    });

    const completedQuizzes = [];
    let totalScore = 0;
    let totalMarks = 0;
    let passedQuizzes = 0;

    // Get unique instructor IDs
    const instructorIds = [...new Set(quizzes.map((quiz) => quiz.instructor))];

    // Fetch instructor details from Clerk
    const instructorDetails = {};
    for (const id of instructorIds) {
      try {
        const user = await clerkClient.users.getUser(id);
        instructorDetails[id] = {
          firstName: user.firstName,
          lastName: user.lastName,
        };
      } catch (error) {
        console.error(`Error fetching instructor ${id}:`, error);
        instructorDetails[id] = { firstName: "غير محدد", lastName: "" };
      }
    }

    quizzes.forEach((quiz) => {
      const submission = quiz.submissions.find(
        (sub) => sub.student === studentId
      );
      if (submission) {
        const quizData = {
          title: quiz.title,
          course: {
            title: quiz.course?.courseTitle || "غير محدد",
          },
          instructor: instructorDetails[quiz.instructor] || {
            firstName: "غير محدد",
            lastName: "",
          },
          score: submission.score,
          totalMarks: quiz.totalMarks,
          percentage: (submission.score / quiz.totalMarks) * 100,
          submittedAt: submission.submittedAt,
          status: submission.status,
          grade: submission.grade,
          answers: submission.answers.map((answer) => {
            const question = quiz.questions.find(
              (q) => q._id.toString() === answer.questionId.toString()
            );
            return {
              questionText: question.questionText,
              questionType: question.questionType,
              answer: answer.answer,
              isCorrect: answer.isCorrect,
              score: answer.score,
              maxScore: question.marks,
              feedback: answer.feedback,
            };
          }),
        };
        completedQuizzes.push(quizData);

        totalScore += submission.score;
        totalMarks += quiz.totalMarks;
        if (submission.status === "ناجح") {
          passedQuizzes++;
        }
      }
    });

    // Calculate analytics
    const analytics = {
      completedQuizzes,
      averageScore:
        completedQuizzes.length > 0 ? (totalScore / totalMarks) * 100 : 0,
      passRate:
        completedQuizzes.length > 0
          ? (passedQuizzes / completedQuizzes.length) * 100
          : 0,
      totalAttempts: completedQuizzes.length,
      scoreProgress: completedQuizzes.map((quiz) => ({
        date: new Date(quiz.submittedAt).toLocaleDateString(),
        score: quiz.percentage,
      })),
      scoreDistribution: [
        { name: "ناجح", value: passedQuizzes },
        { name: "راسب", value: completedQuizzes.length - passedQuizzes },
      ],
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
