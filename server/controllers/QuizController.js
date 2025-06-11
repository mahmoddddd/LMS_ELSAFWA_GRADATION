import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import cloudinary from "cloudinary";

// Helper function to check if user is educator
const isEducator = async (userId) => {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata.role === "educator";
  } catch (error) {
    console.error("Error checking educator role:", error);
    return false;
  }
};

// Helper function to get clerk ID from request
const getClerkId = (req) => {
  const clerkId = req.auth?.userId;
  if (!clerkId) {
    throw new Error("Unauthorized");
  }
  return clerkId;
};

// ============= EDUCATOR CONTROLLERS =============

// Create new quiz
export const createQuiz = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { title, description, courseId, dueDate, totalMarks, questions } =
      req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
      });
    }

    // Verify if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // Validate each question
    for (const question of questions) {
      if (!question.questionText || !question.questionType || !question.marks) {
        return res.status(400).json({
          success: false,
          message: "Each question must have text, type, and marks",
        });
      }

      if (question.questionType === "multiple_choice") {
        if (!Array.isArray(question.options) || question.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: "Multiple choice questions must have at least 2 options",
          });
        }

        const hasCorrectOption = question.options.some((opt) => opt.isCorrect);
        if (!hasCorrectOption) {
          return res.status(400).json({
            success: false,
            message: "Multiple choice questions must have one correct option",
          });
        }
      }
    }

    const quiz = new Quiz({
      title,
      description,
      course: courseId,
      instructor: clerkId,
      dueDate,
      totalMarks,
      questions,
    });

    await quiz.save();

    // Add quiz to course's quizzes array
    course.quizzes.push(quiz._id);
    await course.save();

    res.json({ success: true, quiz });
  } catch (error) {
    console.error("Error creating quiz:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quiz",
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, quiz: updatedQuiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quiz",
      });
    }

    await quiz.deleteOne();
    res.json({ success: true, message: "Quiz deleted" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= STUDENT CONTROLLERS =============

// Get all quizzes for a course
export const getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
      });
    }

    const quizzes = await Quiz.find({ course: courseId })
      .populate("course", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single quiz
export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    const quiz = await Quiz.findById(id)
      .populate("course", "title")
      .populate("instructor", "firstName lastName");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching quiz",
    });
  }
};

// Submit quiz
export const submitQuiz = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if quiz is still open
    if (new Date() > new Date(quiz.dueDate)) {
      return res.status(400).json({
        success: false,
        message: "Quiz submission deadline has passed",
      });
    }

    // Check if student has already submitted
    const existingSubmission = quiz.submissions.find(
      (sub) => sub.student === clerkId
    );
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this quiz",
      });
    }

    const { answers } = req.body;

    // Validate answers format
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid answers format or number of answers",
      });
    }

    // Calculate score and grade answers
    let totalScore = 0;
    let correctAnswers = 0;
    let totalQuestions = quiz.questions.length;
    let multipleChoiceQuestions = 0;
    let textQuestions = 0;

    const gradedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      let isCorrect = false;
      let score = 0;
      let feedback = "";

      if (question.questionType === "multiple_choice") {
        multipleChoiceQuestions++;
        const selectedOption = question.options[answer.selectedOption];

        if (!selectedOption) {
          feedback = "Invalid option selected";
        } else {
          isCorrect = selectedOption.isCorrect;
          score = isCorrect ? question.marks : 0;
          feedback = isCorrect ? "Correct answer!" : "Wrong answer";

          if (isCorrect) {
            correctAnswers++;
          }
        }
      } else if (question.questionType === "text") {
        textQuestions++;
        // For text questions, we'll just store the answer
        // Manual grading will be required
        score = 0;
        feedback = "Pending manual grading";
      }

      totalScore += score;
      return {
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        answer: answer,
        correctAnswer:
          question.questionType === "multiple_choice"
            ? question.options.findIndex((opt) => opt.isCorrect)
            : null,
        isCorrect,
        score,
        maxScore: question.marks,
        feedback,
      };
    });

    // Calculate statistics
    const statistics = {
      totalQuestions,
      multipleChoiceQuestions,
      textQuestions,
      correctAnswers,
      totalScore,
      maxPossibleScore: quiz.totalMarks,
      percentage: (totalScore / quiz.totalMarks) * 100,
      autoGradedPercentage:
        multipleChoiceQuestions > 0
          ? (correctAnswers / multipleChoiceQuestions) * 100
          : 0,
    };

    // Create submission
    const submission = {
      student: clerkId,
      answers: gradedAnswers,
      score: totalScore,
      statistics,
      submittedAt: new Date(),
    };

    quiz.submissions.push(submission);
    await quiz.save();

    res.json({
      success: true,
      submission,
      statistics,
      message: "Quiz submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student's submission
export const getStudentSubmission = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const submission = quiz.submissions.find((sub) => sub.student === clerkId);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "No submission found" });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student's progress
export const getStudentProgress = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { courseId } = req.params;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
      });
    }

    const quizzes = await Quiz.find({ course: courseId });

    const progress = {
      totalQuizzes: quizzes.length,
      completedQuizzes: 0,
      totalScore: 0,
      maxPossibleScore: 0,
    };

    quizzes.forEach((quiz) => {
      progress.maxPossibleScore += quiz.totalMarks;
      const submission = quiz.submissions.find(
        (sub) => sub.student === clerkId
      );
      if (submission) {
        progress.completedQuizzes++;
        progress.totalScore += submission.score || 0;
      }
    });

    progress.averageScore =
      progress.completedQuizzes > 0
        ? (progress.totalScore / progress.maxPossibleScore) * 100
        : 0;

    res.json({ success: true, progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student's submission history
export const getStudentSubmissionHistory = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const submissions = quiz.submissions
      .filter((sub) => sub.student === clerkId)
      .sort((a, b) => b.submittedAt - a.submittedAt);

    res.json({ success: true, submissions });
  } catch (error) {
    console.error("Error fetching submission history:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check submission eligibility
export const checkSubmissionEligibility = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const eligibility = {
      canSubmit: true,
      reason: null,
    };

    // Check if deadline has passed
    if (new Date() > new Date(quiz.dueDate)) {
      eligibility.canSubmit = false;
      eligibility.reason = "Submission deadline has passed";
    }

    // Check if already submitted
    const existingSubmission = quiz.submissions.find(
      (sub) => sub.student === clerkId
    );
    if (existingSubmission) {
      eligibility.canSubmit = false;
      eligibility.reason = "You have already submitted this quiz";
    }

    res.json({ success: true, eligibility });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quiz statistics
export const getQuizStatistics = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view quiz statistics",
      });
    }

    // Calculate statistics
    const totalSubmissions = quiz.submissions.length;
    const totalStudents = quiz.submissions.reduce((unique, submission) => {
      if (!unique.includes(submission.student)) {
        unique.push(submission.student);
      }
      return unique;
    }, []).length;

    // Calculate average score
    const totalScore = quiz.submissions.reduce(
      (sum, submission) => sum + submission.score,
      0
    );
    const averageScore =
      totalSubmissions > 0 ? totalScore / totalSubmissions : 0;

    // Calculate question-wise statistics
    const questionStats = quiz.questions.map((question, index) => {
      const correctAnswers = quiz.submissions.reduce((count, submission) => {
        const answer = submission.answers[index];
        return count + (answer?.isCorrect ? 1 : 0);
      }, 0);

      return {
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        totalAttempts: totalSubmissions,
        correctAnswers,
        correctPercentage:
          totalSubmissions > 0 ? (correctAnswers / totalSubmissions) * 100 : 0,
        averageScore:
          totalSubmissions > 0
            ? (correctAnswers * question.marks) / totalSubmissions
            : 0,
      };
    });

    // Calculate score distribution
    const scoreDistribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    quiz.submissions.forEach((submission) => {
      const percentage = (submission.score / quiz.totalMarks) * 100;
      if (percentage <= 20) scoreDistribution["0-20"]++;
      else if (percentage <= 40) scoreDistribution["21-40"]++;
      else if (percentage <= 60) scoreDistribution["41-60"]++;
      else if (percentage <= 80) scoreDistribution["61-80"]++;
      else scoreDistribution["81-100"]++;
    });

    const statistics = {
      quizId: quiz._id,
      quizTitle: quiz.title,
      totalSubmissions,
      totalStudents,
      averageScore,
      scoreDistribution,
      questionStats,
      submissions: quiz.submissions.map((submission) => ({
        student: submission.student,
        score: submission.score,
        percentage: (submission.score / quiz.totalMarks) * 100,
        submittedAt: submission.submittedAt,
      })),
    };

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("Error getting quiz statistics:", error);
    if (error.message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quiz leaderboard
export const getQuizLeaderboard = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Get all submissions and sort by score
    const leaderboard = quiz.submissions
      .map((submission) => ({
        student: submission.student,
        score: submission.score,
        percentage: (submission.score / quiz.totalMarks) * 100,
        submittedAt: submission.submittedAt,
        timeTaken: submission.timeTaken || 0, // في دقائق
        attempts: submission.attempts || 1,
      }))
      .sort((a, b) => {
        // ترتيب حسب النتيجة أولاً
        if (b.score !== a.score) return b.score - a.score;
        // في حالة تساوي النتيجة، نرتب حسب وقت التقديم
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      });

    // إضافة معلومات إضافية
    const enhancedLeaderboard = await Promise.all(
      leaderboard.map(async (entry, index) => {
        try {
          const user = await clerkClient.users.getUser(entry.student);
          return {
            rank: index + 1,
            studentName: `${user.firstName} ${user.lastName}`,
            studentImage: user.imageUrl,
            ...entry,
          };
        } catch (error) {
          return {
            rank: index + 1,
            studentName: "Unknown Student",
            ...entry,
          };
        }
      })
    );

    res.json({
      success: true,
      leaderboard: enhancedLeaderboard,
      quizInfo: {
        title: quiz.title,
        totalMarks: quiz.totalMarks,
        totalSubmissions: quiz.submissions.length,
      },
    });
  } catch (error) {
    console.error("Error getting quiz leaderboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student performance analytics
export const getStudentAnalytics = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { courseId } = req.params;

    // Get all quizzes in the course
    const quizzes = await Quiz.find({ course: courseId });

    // Calculate student performance
    const performance = {
      totalQuizzes: quizzes.length,
      completedQuizzes: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      improvement: 0,
      strengths: [],
      weaknesses: [],
      timeSpent: 0,
      consistency: 0,
    };

    let totalScore = 0;
    let previousScores = [];

    for (const quiz of quizzes) {
      const submission = quiz.submissions.find(
        (sub) => sub.student === clerkId
      );
      if (submission) {
        performance.completedQuizzes++;
        const score = submission.score;
        totalScore += score;
        previousScores.push(score);

        // تحليل نقاط القوة والضعف
        submission.answers.forEach((answer, index) => {
          const question = quiz.questions[index];
          if (answer.isCorrect) {
            if (!performance.strengths.includes(question.questionType)) {
              performance.strengths.push(question.questionType);
            }
          } else {
            if (!performance.weaknesses.includes(question.questionType)) {
              performance.weaknesses.push(question.questionType);
            }
          }
        });

        // حساب الوقت المستغرق
        if (submission.timeTaken) {
          performance.timeSpent += submission.timeTaken;
        }
      }
    }

    // حساب المتوسطات والإحصائيات
    if (performance.completedQuizzes > 0) {
      performance.averageScore = totalScore / performance.completedQuizzes;
      performance.highestScore = Math.max(...previousScores);
      performance.lowestScore = Math.min(...previousScores);

      // حساب التحسن
      if (previousScores.length > 1) {
        const firstHalf = previousScores.slice(
          0,
          Math.floor(previousScores.length / 2)
        );
        const secondHalf = previousScores.slice(
          Math.floor(previousScores.length / 2)
        );
        const firstAvg =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        performance.improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
      }

      // حساب الاتساق
      const standardDeviation = Math.sqrt(
        previousScores.reduce((acc, score) => {
          return acc + Math.pow(score - performance.averageScore, 2);
        }, 0) / previousScores.length
      );
      performance.consistency =
        100 - (standardDeviation / performance.averageScore) * 100;
    }

    res.json({
      success: true,
      analytics: performance,
    });
  } catch (error) {
    console.error("Error getting student analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload question file
export const uploadQuestionFile = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, questionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload files",
      });
    }

    const question = quiz.questions.id(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Update question with file information
    question.fileUrl = req.file.path; // Cloudinary URL
    question.fileType = req.file.mimetype;
    question.fileId = req.file.filename; // Cloudinary public_id
    await quiz.save();

    res.json({
      success: true,
      message: "File uploaded successfully",
      fileUrl: req.file.path,
      fileId: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading question file:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload answer file
export const uploadAnswerFile = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, questionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const question = quiz.questions.id(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Check file size
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > question.maxFileSize) {
      // Delete uploaded file from Cloudinary if size exceeds limit
      await cloudinary.v2.uploader.destroy(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `File size exceeds the maximum limit of ${question.maxFileSize}MB`,
      });
    }

    // Check file type
    if (!question.fileType.includes(req.file.mimetype)) {
      // Delete uploaded file from Cloudinary if type is not allowed
      await cloudinary.v2.uploader.destroy(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${question.fileType.join(
          ", "
        )}`,
      });
    }

    // Find or create submission
    let submission = quiz.submissions.find((sub) => sub.student === clerkId);
    if (!submission) {
      submission = {
        student: clerkId,
        answers: [],
        score: 0,
        submittedAt: new Date(),
      };
      quiz.submissions.push(submission);
    }

    // Update or add answer
    const answerIndex = submission.answers.findIndex(
      (ans) => ans.questionId.toString() === questionId
    );

    const answer = {
      questionId,
      fileUrl: req.file.path, // Cloudinary URL
      fileId: req.file.filename, // Cloudinary public_id
      fileName: req.file.originalname,
      fileSize: fileSizeMB,
      isCorrect: false,
      score: 0,
    };

    if (answerIndex === -1) {
      submission.answers.push(answer);
    } else {
      // Delete old file from Cloudinary if exists
      const oldAnswer = submission.answers[answerIndex];
      if (oldAnswer.fileId) {
        await cloudinary.v2.uploader.destroy(oldAnswer.fileId);
      }
      submission.answers[answerIndex] = answer;
    }

    await quiz.save();

    res.json({
      success: true,
      message: "Answer file uploaded successfully",
      fileUrl: req.file.path,
      fileId: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading answer file:", error);
    // Delete uploaded file from Cloudinary if error occurs
    if (req.file && req.file.filename) {
      await cloudinary.v2.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete file from Cloudinary
export const deleteFile = async (fileId) => {
  try {
    await cloudinary.v2.uploader.destroy(fileId);
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
  }
};

// Grade file submission
export const gradeFileSubmission = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, submissionId, answerId } = req.params;
    const { score, feedback } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to grade submissions",
      });
    }

    const submission = quiz.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const answer = submission.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Update answer with grade
    answer.score = score;
    answer.feedback = feedback;
    answer.gradedAt = new Date();
    answer.gradedBy = clerkId;

    // Update submission total score
    submission.score = submission.answers.reduce(
      (total, ans) => total + ans.score,
      0
    );

    await quiz.save();

    res.json({
      success: true,
      message: "Answer graded successfully",
      submission,
    });
  } catch (error) {
    console.error("Error grading file submission:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
