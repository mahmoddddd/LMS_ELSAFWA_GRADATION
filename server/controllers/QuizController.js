import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import cloudinary from "cloudinary";
import User from "../models/User.js";

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
  try {
    // First try to get from auth object
    if (req.auth?.userId) {
      return req.auth.userId;
    }

    // If not in auth object, try to extract from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new Error("Unauthorized");
    }

    // Decode the JWT token to get the sub claim (Clerk user ID)
    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    if (!decoded.sub) {
      throw new Error("Unauthorized");
    }

    return decoded.sub;
  } catch (error) {
    console.error("Error extracting Clerk ID:", error);
    throw new Error("Unauthorized");
  }
};

// ============= EDUCATOR CONTROLLERS =============

// Create new quiz
export const createQuiz = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const {
      title,
      description,
      courseId,
      dueDate,
      totalMarks,
      questions,
      isFileQuiz,
    } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
      });
    }

    // Verify if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Handle file upload if it's a file quiz
    let quizFile = null;
    if (isFileQuiz && req.file) {
      quizFile = {
        fileUrl: req.file.path,
        fileId: req.file.filename,
        fileType: req.file.mimetype,
      };
    }

    // Create quiz object
    const quizData = {
      title,
      description,
      course: courseId,
      instructor: clerkId,
      dueDate,
      totalMarks,
      isFileQuiz,
      quizFile,
      questions: questions || [],
    };

    const quiz = new Quiz(quizData);
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
    const { quizId } = req.params;
    const { answers } = req.body;
    const studentId = getClerkId(req);

    console.log("Received submission request:", {
      quizId,
      studentId,
      answers,
    });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    // Check if student has already submitted
    const existingSubmission = quiz.submissions.find(
      (sub) => sub.student === studentId
    );
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "لقد قمت بتقديم هذا الاختبار من قبل",
      });
    }

    // Get student details
    const student = await User.findOne({ clerkId: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على بيانات الطالب",
      });
    }

    // Grade answers and calculate score
    let totalScore = 0;
    const gradedAnswers = answers
      .map((answer) => {
        const question = quiz.questions.find(
          (q) => q._id.toString() === answer.questionId
        );
        if (!question) {
          console.log("Question not found for answer:", answer);
          return null;
        }

        let score = 0;
        let isCorrect = false;
        let feedback = "";

        if (question.questionType === "multiple_choice") {
          const selectedOption = question.options.find(
            (opt) => opt.text === answer.selectedOption
          );
          isCorrect = selectedOption?.isCorrect || false;
          score = isCorrect ? question.marks : 0;
          feedback = isCorrect ? "إجابة صحيحة" : "إجابة خاطئة";
        } else if (question.questionType === "text") {
          isCorrect = answer.textAnswer === question.correctAnswer;
          score = isCorrect ? question.marks : 0;
          feedback = isCorrect ? "إجابة صحيحة" : "إجابة خاطئة";
        }

        totalScore += score;

        return {
          questionId: question._id,
          questionText: question.questionText,
          answer: {
            selectedOption: answer.selectedOption || "",
            textAnswer: answer.textAnswer || "",
          },
          correctAnswer:
            question.questionType === "multiple_choice"
              ? question.options.find((opt) => opt.isCorrect)?.text || ""
              : question.correctAnswer || "",
          score,
          maxScore: question.marks,
          isCorrect,
          feedback,
        };
      })
      .filter(Boolean);

    console.log("Graded answers:", gradedAnswers);
    console.log("Total score:", totalScore);

    // Calculate percentage and grade
    const percentage = (totalScore / quiz.totalMarks) * 100;
    let gradeText = "راسب";
    if (percentage >= 90) gradeText = "ممتاز";
    else if (percentage >= 80) gradeText = "جيد جداً";
    else if (percentage >= 70) gradeText = "جيد";
    else if (percentage >= 60) gradeText = "مقبول";

    // Create submission object
    const submission = {
      student: studentId,
      answers: gradedAnswers,
      score: totalScore,
      totalMarks: quiz.totalMarks,
      percentage,
      gradeText,
      status: percentage >= 60 ? "ناجح" : "راسب",
      submittedAt: new Date(),
    };

    console.log("Created submission:", submission);

    // Add submission to quiz
    quiz.submissions.push(submission);
    await quiz.save();

    console.log("Saved submission to database");

    res.json({
      success: true,
      message: "تم تقديم الاختبار بنجاح",
      submission: {
        ...submission,
        student: {
          id: studentId,
          name: student.name,
          email: student.email,
        },
      },
    });
  } catch (error) {
    console.error("Error in submitQuiz:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تقديم الاختبار",
    });
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
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .map((submission) => {
        // Calculate percentage if not already set
        const percentage =
          submission.percentage ||
          (submission.score / submission.totalMarks) * 100;

        // Determine grade text based on percentage
        let gradeText = "لم يتم التقدير";
        if (percentage >= 90) {
          gradeText = "ممتاز";
        } else if (percentage >= 80) {
          gradeText = "جيد جداً";
        } else if (percentage >= 70) {
          gradeText = "جيد";
        } else if (percentage >= 60) {
          gradeText = "مقبول";
        } else if (percentage > 0) {
          gradeText = "راسب";
        }

        // Determine status based on percentage
        const status = percentage >= 60 ? "ناجح" : "راسب";

        return {
          _id: submission._id,
          student: submission.student,
          score: submission.score,
          totalMarks: submission.totalMarks,
          percentage: percentage.toFixed(2),
          gradeText,
          status,
          submittedAt: submission.submittedAt,
          answers: submission.answers.map((answer) => ({
            questionId: answer.questionId,
            questionText: answer.questionText,
            answer: answer.answer,
            score: answer.score,
            maxScore: answer.maxScore,
            isCorrect: answer.isCorrect,
            feedback: answer.feedback,
          })),
        };
      });

    res.json({
      success: true,
      submissions,
      quizTitle: quiz.title,
      totalMarks: quiz.totalMarks,
    });
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
      (sum, submission) => sum + (submission.score || 0),
      0
    );
    const averageScore =
      totalSubmissions > 0 ? totalScore / totalSubmissions : 0;

    // Calculate grade distribution
    const gradeDistribution = {
      excellent: 0, // 90-100
      veryGood: 0, // 80-89
      good: 0, // 70-79
      acceptable: 0, // 60-69
      failed: 0, // < 60
    };

    // Format submissions for display
    const formattedSubmissions = quiz.submissions.map((submission) => {
      // Calculate percentage
      const percentage = (submission.score / quiz.totalMarks) * 100;

      // Determine grade text based on percentage
      let gradeText = "لم يتم التقدير";
      if (percentage >= 90) {
        gradeText = "ممتاز";
        gradeDistribution.excellent++;
      } else if (percentage >= 80) {
        gradeText = "جيد جداً";
        gradeDistribution.veryGood++;
      } else if (percentage >= 70) {
        gradeText = "جيد";
        gradeDistribution.good++;
      } else if (percentage >= 60) {
        gradeText = "مقبول";
        gradeDistribution.acceptable++;
      } else if (percentage > 0) {
        gradeText = "راسب";
        gradeDistribution.failed++;
      }

      // Determine status based on percentage
      const status = percentage >= 60 ? "ناجح" : "راسب";

      return {
        student: submission.student,
        score: submission.score || 0,
        totalMarks: quiz.totalMarks,
        percentage: percentage.toFixed(2),
        gradeText,
        status,
        submittedAt: submission.submittedAt,
        feedback: submission.feedback || "",
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy,
      };
    });

    // === NEW: Calculate questionStats ===
    const questionStats = quiz.questions.map((question) => {
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      quiz.submissions.forEach((submission) => {
        const answer = submission.answers.find(
          (a) => a.questionId.toString() === question._id.toString()
        );
        if (answer) {
          if (answer.isCorrect) correctAnswers++;
          else incorrectAnswers++;
        }
      });
      return {
        questionId: question._id,
        questionText: question.questionText,
        correctAnswers,
        incorrectAnswers,
      };
    });
    // === END NEW ===

    res.json({
      success: true,
      statistics: {
        totalSubmissions,
        totalStudents,
        averageScore,
        passRate:
          ((gradeDistribution.acceptable +
            gradeDistribution.good +
            gradeDistribution.veryGood +
            gradeDistribution.excellent) /
            totalSubmissions) *
          100,
        gradeDistribution,
        submissions: formattedSubmissions,
        quiz: {
          title: quiz.title,
          totalMarks: quiz.totalMarks,
          questions: quiz.questions.length,
        },
        questionStats,
      },
    });
  } catch (error) {
    console.error("Error getting quiz statistics:", error);
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
      completedQuizzes: [], // إضافة مصفوفة للكويزات المكتملة
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
        const percentage = (score / quiz.totalMarks) * 100;
        totalScore += score;
        previousScores.push(score);

        // إضافة معلومات الكويز المكتمل
        performance.completedQuizzes.push({
          title: quiz.title,
          score: score,
          percentage: percentage.toFixed(1),
          submittedAt: submission.submittedAt,
          totalMarks: quiz.totalMarks,
        });

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

// Upload question file
export const uploadQuestionFile = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, questionId } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    if (quiz.instructor !== clerkId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const question = quiz.questions.id(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    // Extract file extension
    const getFileExtension = (mimetype) => {
      switch (mimetype) {
        case "application/pdf":
          return "pdf";
        case "application/msword":
          return "doc";
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return "docx";
        default:
          return null;
      }
    };

    const fileType = getFileExtension(req.file.mimetype);
    if (!fileType) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    question.fileUrl = req.file.path; // Cloudinary URL
    question.fileType = fileType; // Correct extension
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
// Upload student answer file
export const uploadAnswerFile = async (req, res) => {
  try {
    const studentId = getClerkId(req);
    const { quizId, questionId } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const question = quiz.questions.id(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    // Get correct file extension
    const getFileExtension = (mimetype) => {
      switch (mimetype) {
        case "application/pdf":
          return "pdf";
        case "application/msword":
          return "doc";
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return "docx";
        default:
          return null;
      }
    };

    const fileType = getFileExtension(req.file.mimetype);
    if (!fileType) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    // Find or create submission
    let submission = quiz.submissions.find((sub) => sub.student === studentId);

    if (!submission) {
      submission = {
        student: studentId,
        answers: [],
        score: 0,
      };
      quiz.submissions.push(submission);
    }

    // Find or add answer
    let answer = submission.answers.find(
      (ans) => ans.questionId.toString() === questionId
    );

    if (!answer) {
      answer = {
        questionId,
        answer: null,
        isCorrect: false,
        score: 0,
      };
      submission.answers.push(answer);
    }

    answer.fileUrl = req.file.path;
    answer.fileId = req.file.filename;
    answer.fileName = req.file.originalname;
    answer.fileSize = +(req.file.size / (1024 * 1024)).toFixed(2); // Convert to MB
    answer.fileType = fileType;

    await quiz.save();

    res.json({
      success: true,
      message: "Answer file uploaded successfully",
      fileUrl: req.file.path,
      fileId: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading answer file:", error);
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

// Grade submission
export const gradeSubmission = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, studentId } = req.params;
    const { grade, feedback } = req.body;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
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
        message: "Not authorized to grade submissions",
      });
    }

    // Find the submission
    const submission = quiz.submissions.find(
      (sub) => sub.student === studentId
    );
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Calculate total score from answers
    let totalScore = 0;
    let totalMaxScore = 0;

    submission.answers.forEach((answer) => {
      if (answer.questionType === "multiple_choice") {
        // For multiple choice, use the existing score
        totalScore += answer.score || 0;
        totalMaxScore += answer.maxScore || 0;
      } else if (answer.questionType === "text") {
        // For text questions, use the provided grade proportionally
        const questionScore = (grade / quiz.totalMarks) * answer.maxScore;
        answer.score = questionScore;
        totalScore += questionScore;
        totalMaxScore += answer.maxScore || 0;
      }
    });

    // Calculate grade text based on percentage
    const percentage = (totalScore / totalMaxScore) * 100;
    let gradeText = "";
    if (percentage >= 90) {
      gradeText = "ممتاز";
    } else if (percentage >= 80) {
      gradeText = "جيد جداً";
    } else if (percentage >= 70) {
      gradeText = "جيد";
    } else if (percentage >= 60) {
      gradeText = "مقبول";
    } else {
      gradeText = "راسب";
    }

    // Update submission with all grade information
    submission.score = totalScore;
    submission.totalMaxScore = totalMaxScore;
    submission.percentage = percentage;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = clerkId;
    submission.gradeText = gradeText;

    // Update each answer with its grade information
    submission.answers.forEach((answer) => {
      answer.gradedAt = new Date();
      answer.gradedBy = clerkId;
      if (answer.questionType === "text") {
        answer.feedback = feedback;
      }
    });

    await quiz.save();

    res.json({
      success: true,
      message: "تم تقدير التقديم بنجاح",
      submission: {
        ...submission.toObject(),
        gradeText,
        percentage,
        totalMaxScore,
      },
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get submission details
export const getSubmissionDetails = async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    console.log("=== Starting getSubmissionDetails ===");
    console.log("Quiz ID:", quizId);
    console.log("Student ID:", studentId);

    const quiz = await Quiz.findById(quizId);
    console.log("Found Quiz:", quiz ? "Yes" : "No");
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    const submission = quiz.submissions.find(
      (sub) => sub.student === studentId
    );
    console.log("Found Submission:", submission ? "Yes" : "No");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على التقديم",
      });
    }

    console.log("Submission Details:", {
      student: submission.student,
      score: submission.score,
      answers: submission.answers,
    });

    // Get student details from database
    const student = await User.findOne({ clerkId: submission.student });
    console.log("Found Student:", student ? "Yes" : "No");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على بيانات الطالب",
      });
    }

    // Calculate total marks from questions
    const totalMarks = quiz.questions.reduce(
      (total, question) => total + question.marks,
      0
    );
    console.log("Total Marks:", totalMarks);

    // Calculate total score from answers
    const totalScore = submission.answers.reduce(
      (total, answer) => total + (answer.score || 0),
      0
    );
    console.log("Total Score:", totalScore);

    // Calculate percentage
    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    console.log("Percentage:", percentage);

    // Determine grade text based on percentage
    let gradeText = "لم يتم التقدير";
    if (percentage >= 90) {
      gradeText = "ممتاز";
    } else if (percentage >= 80) {
      gradeText = "جيد جداً";
    } else if (percentage >= 70) {
      gradeText = "جيد";
    } else if (percentage >= 60) {
      gradeText = "مقبول";
    } else if (percentage > 0) {
      gradeText = "راسب";
    }
    console.log("Grade Text:", gradeText);

    // Determine status based on percentage
    const status = percentage >= 60 ? "ناجح" : "راسب";
    console.log("Status:", status);

    // Format submission data
    const formattedSubmission = {
      student: {
        id: submission.student,
        email: student.email,
        name: student.name,
      },
      quizTitle: quiz.title,
      submittedAt: submission.submittedAt,
      score: totalScore,
      totalMarks: totalMarks,
      percentage: percentage.toFixed(2),
      gradeText,
      status,
      answers: submission.answers.map((answer) => {
        console.log("Processing Answer:", {
          questionId: answer.questionId,
          correctAnswer: answer.correctAnswer,
          studentAnswer: answer.answer,
        });

        return {
          questionId: answer.questionId,
          questionText: answer.questionText,
          questionType: answer.questionType || "multiple_choice",
          answer: answer.answer,
          correctAnswer: answer.correctAnswer,
          score: answer.score || 0,
          maxScore: answer.maxScore || 10,
          isCorrect: answer.isCorrect,
          feedback: answer.feedback || "",
        };
      }),
    };

    console.log("=== Final Formatted Submission ===");
    console.log(
      "Complete Submission Data:",
      JSON.stringify(formattedSubmission, null, 2)
    );

    res.json({
      success: true,
      submission: formattedSubmission,
    });
  } catch (error) {
    console.error("=== Error in getSubmissionDetails ===");
    console.error("Error:", error);
    console.error("Error Stack:", error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    // Format submissions with complete information
    const formattedSubmissions = await Promise.all(
      quiz.submissions.map(async (submission) => {
        // Get student details
        const student = await User.findOne({ clerkId: submission.student });

        return {
          id: submission._id,
          student: {
            id: submission.student,
            name: student ? student.name : "غير معروف",
            email: student ? student.email : "غير معروف",
          },
          submittedAt: submission.submittedAt,
          score: submission.score,
          totalMarks: submission.totalMarks,
          percentage: submission.percentage,
          gradeText: submission.gradeText,
          status: submission.status,
        };
      })
    );

    res.json({
      success: true,
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error("Error in getQuizSubmissions:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تقديمات الاختبار",
    });
  }
};

// Get aggregated analytics for all educator quizzes
export const getEducatorAnalytics = async (req, res) => {
  try {
    const clerkId = getClerkId(req);

    // Get all quizzes for the educator
    const quizzes = await Quiz.find({ instructor: clerkId })
      .populate("course", "courseTitle")
      .sort({ createdAt: -1 });

    if (!quizzes || quizzes.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalQuizzes: 0,
          totalSubmissions: 0,
          totalStudents: 0,
          averageScore: 0,
          passRate: 0,
          courseStats: {},
          gradeDistribution: {
            excellent: 0,
            veryGood: 0,
            good: 0,
            acceptable: 0,
            failed: 0,
          },
          monthlyStats: {},
          topPerformingQuizzes: [],
        },
      });
    }

    // Calculate analytics
    const analytics = {
      totalQuizzes: quizzes.length,
      totalSubmissions: 0,
      totalStudents: new Set(),
      averageScore: 0,
      passRate: 0,
      courseStats: {},
      gradeDistribution: {
        excellent: 0,
        veryGood: 0,
        good: 0,
        acceptable: 0,
        failed: 0,
      },
      monthlyStats: {},
      topPerformingQuizzes: [],
    };

    let totalScore = 0;
    let totalMarks = 0;
    let totalPassed = 0;

    quizzes.forEach((quiz) => {
      const courseId = quiz.course._id;
      if (!analytics.courseStats[courseId]) {
        analytics.courseStats[courseId] = {
          courseTitle: quiz.course.courseTitle,
          totalQuizzes: 0,
          totalSubmissions: 0,
          totalScore: 0,
          totalMarks: 0,
          passRate: 0,
        };
      }

      analytics.courseStats[courseId].totalQuizzes++;
      analytics.totalSubmissions += quiz.submissions.length;

      quiz.submissions.forEach((submission) => {
        analytics.totalStudents.add(submission.student);

        // Calculate percentage for this submission
        const submissionPercentage = (submission.score / quiz.totalMarks) * 100;
        totalScore += submission.score;
        totalMarks += quiz.totalMarks;

        // Add to course stats
        analytics.courseStats[courseId].totalSubmissions++;
        analytics.courseStats[courseId].totalScore += submission.score;
        analytics.courseStats[courseId].totalMarks += quiz.totalMarks;

        if (submission.status === "ناجح" || submissionPercentage >= 60) {
          totalPassed++;
          analytics.courseStats[courseId].passRate++;
        }

        // Grade distribution based on percentage
        if (submissionPercentage >= 90) analytics.gradeDistribution.excellent++;
        else if (submissionPercentage >= 80)
          analytics.gradeDistribution.veryGood++;
        else if (submissionPercentage >= 70) analytics.gradeDistribution.good++;
        else if (submissionPercentage >= 60)
          analytics.gradeDistribution.acceptable++;
        else analytics.gradeDistribution.failed++;

        // Monthly stats
        const month = new Date(submission.submittedAt).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "short" }
        );
        if (!analytics.monthlyStats[month]) {
          analytics.monthlyStats[month] = {
            submissions: 0,
            totalScore: 0,
            totalMarks: 0,
          };
        }
        analytics.monthlyStats[month].submissions++;
        analytics.monthlyStats[month].totalScore += submission.score;
        analytics.monthlyStats[month].totalMarks += quiz.totalMarks;
      });
    });

    // Calculate overall averages
    analytics.averageScore =
      totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    analytics.passRate =
      analytics.totalSubmissions > 0
        ? (totalPassed / analytics.totalSubmissions) * 100
        : 0;

    // Calculate course averages
    Object.keys(analytics.courseStats).forEach((courseId) => {
      const course = analytics.courseStats[courseId];
      course.averageScore =
        course.totalMarks > 0
          ? (course.totalScore / course.totalMarks) * 100
          : 0;
      course.passRate =
        course.totalSubmissions > 0
          ? (course.passRate / course.totalSubmissions) * 100
          : 0;

      // Clean up temporary fields
      delete course.totalScore;
      delete course.totalMarks;
    });

    // Top performing quizzes
    analytics.topPerformingQuizzes = quizzes
      .map((quiz) => {
        if (quiz.submissions.length === 0) {
          return {
            title: quiz.title,
            courseTitle: quiz.course.courseTitle,
            averageScore: 0,
            submissions: 0,
          };
        }

        const quizTotalScore = quiz.submissions.reduce(
          (sum, sub) => sum + sub.score,
          0
        );
        const quizTotalMarks = quiz.submissions.length * quiz.totalMarks;
        const averageScore =
          quizTotalMarks > 0 ? (quizTotalScore / quizTotalMarks) * 100 : 0;

        return {
          title: quiz.title,
          courseTitle: quiz.course.courseTitle,
          averageScore: averageScore,
          submissions: quiz.submissions.length,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Convert Set to number for totalStudents
    analytics.totalStudents = analytics.totalStudents.size;

    // Calculate monthly averages
    Object.keys(analytics.monthlyStats).forEach((month) => {
      const stats = analytics.monthlyStats[month];
      stats.averageScore =
        stats.totalMarks > 0 ? (stats.totalScore / stats.totalMarks) * 100 : 0;
      delete stats.totalScore;
      delete stats.totalMarks;
    });

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching educator analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
    });
  }
};

// Generate detailed quiz report
export const generateQuizReport = async (req, res) => {
  try {
    const clerkId = getClerkId(req);
    const { quizId, options, dateRange, scoreRange } = req.body;

    console.log("🔍 Generating quiz report for quizId:", quizId);
    console.log("🔍 Clerk ID:", clerkId);
    console.log("🔍 Options:", options);
    console.log("🔍 Date range:", dateRange);
    console.log("🔍 Score range:", scoreRange);

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Valid quiz ID is required",
      });
    }

    // Get the quiz with submissions
    const quiz = await Quiz.findById(quizId)
      .populate("course", "courseTitle")
      .populate("submissions.student", "name email");

    console.log("🔍 Found quiz:", quiz ? quiz.title : "Not found");
    console.log(
      "🔍 Quiz submissions count:",
      quiz ? quiz.submissions.length : 0
    );
    console.log("🔍 Quiz instructor:", quiz ? quiz.instructor : "N/A");
    console.log("🔍 Current clerk ID:", clerkId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if user is the instructor
    if (quiz.instructor !== clerkId) {
      console.log("❌ Authorization failed - instructor mismatch");
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this quiz report",
      });
    }

    // Filter submissions based on criteria
    let filteredSubmissions = quiz.submissions;
    console.log("🔍 Original submissions count:", filteredSubmissions.length);

    // Date range filter
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      filteredSubmissions = filteredSubmissions.filter((submission) => {
        const submissionDate = new Date(submission.submittedAt);
        const startDate = dateRange.startDate
          ? new Date(dateRange.startDate)
          : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (startDate && submissionDate < startDate) return false;
        if (endDate && submissionDate > endDate) return false;
        return true;
      });
      console.log("🔍 After date filter:", filteredSubmissions.length);
    }

    // Score range filter
    if (scoreRange && (scoreRange.min !== null || scoreRange.max !== null)) {
      filteredSubmissions = filteredSubmissions.filter((submission) => {
        const percentage = (submission.score / quiz.totalMarks) * 100;
        if (scoreRange.min !== null && percentage < scoreRange.min)
          return false;
        if (scoreRange.max !== null && percentage > scoreRange.max)
          return false;
        return true;
      });
      console.log("🔍 After score filter:", filteredSubmissions.length);
    }

    // Pass/Fail only filter
    if (options.showPassFailOnly) {
      filteredSubmissions = filteredSubmissions.filter((submission) => {
        const percentage = (submission.score / quiz.totalMarks) * 100;
        return percentage >= 60 || percentage < 60; // Show both pass and fail
      });
      console.log("🔍 After pass/fail filter:", filteredSubmissions.length);
    }

    console.log(
      "🔍 Final filtered submissions count:",
      filteredSubmissions.length
    );

    // Calculate summary statistics
    const totalSubmissions = filteredSubmissions.length;
    const totalScore = filteredSubmissions.reduce(
      (sum, sub) => sum + sub.score,
      0
    );
    const totalMarks = totalSubmissions * quiz.totalMarks;
    const averageScore = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    const passedStudents = filteredSubmissions.filter((sub) => {
      const percentage = (sub.score / quiz.totalMarks) * 100;
      return percentage >= 60;
    }).length;
    const passRate =
      totalSubmissions > 0 ? (passedStudents / totalSubmissions) * 100 : 0;

    // Prepare report data
    const report = {
      quiz: {
        title: quiz.title,
        courseTitle: quiz.course.courseTitle,
        totalMarks: quiz.totalMarks,
        questions: quiz.questions.length,
      },
      summary: {
        totalSubmissions,
        passedStudents,
        failedStudents: totalSubmissions - passedStudents,
        averageScore,
        passRate,
        totalMarks,
        totalScore,
      },
      filters: {
        dateRange,
        scoreRange,
        options,
      },
    };

    // Add student details if requested
    if (options.includeStudentDetails) {
      // Gather all unique student IDs from filteredSubmissions
      const uniqueStudentIds = [
        ...new Set(filteredSubmissions.map((sub) => sub.student)),
      ].filter(
        (id) =>
          id !== undefined &&
          id !== null &&
          !id.startsWith("sample_") &&
          !id.startsWith("student_")
      );

      // Fetch all real users in one query
      const users = await User.find({ clerkId: { $in: uniqueStudentIds } });
      const userMap = {};
      users.forEach((u) => {
        userMap[u.clerkId] = u.name;
      });

      report.students = filteredSubmissions
        .filter(
          (submission) =>
            !submission.student.startsWith("sample_") &&
            !submission.student.startsWith("student_")
        )
        .map((submission, index) => {
          const percentage =
            submission.percentage || (submission.score / quiz.totalMarks) * 100;

          // Get real student name
          const studentName = userMap[submission.student] || "طالب غير معروف";

          return {
            name: studentName,
            email: `${submission.student}@example.com`,
            score: submission.score,
            totalMarks: quiz.totalMarks,
            percentage,
            status: submission.status || (percentage >= 60 ? "ناجح" : "راسب"),
            grade:
              submission.gradeText ||
              (percentage >= 90
                ? "ممتاز"
                : percentage >= 80
                ? "جيد جداً"
                : percentage >= 70
                ? "جيد"
                : percentage >= 60
                ? "مقبول"
                : "راسب"),
            submittedAt: submission.submittedAt,
            answers: submission.answers,
          };
        });
    }

    // Add grade distribution if requested
    if (options.includeGradeDistribution) {
      const gradeDistribution = {
        ممتاز: 0,
        "جيد جداً": 0,
        جيد: 0,
        مقبول: 0,
        راسب: 0,
      };

      filteredSubmissions.forEach((submission) => {
        const grade =
          submission.gradeText ||
          (() => {
            const percentage =
              submission.percentage ||
              (submission.score / quiz.totalMarks) * 100;
            if (percentage >= 90) return "ممتاز";
            else if (percentage >= 80) return "جيد جداً";
            else if (percentage >= 70) return "جيد";
            else if (percentage >= 60) return "مقبول";
            else return "راسب";
          })();

        gradeDistribution[grade]++;
      });

      report.gradeDistribution = gradeDistribution;
    }

    // Add question analysis if requested
    if (options.includeQuestionAnalysis) {
      const questionAnalysis = quiz.questions.map((question, index) => {
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        filteredSubmissions.forEach((submission) => {
          const answer = submission.answers.find(
            (a) => a.questionId.toString() === question._id.toString()
          );
          if (answer) {
            if (answer.isCorrect) correctAnswers++;
            else incorrectAnswers++;
          }
        });

        const totalAnswers = correctAnswers + incorrectAnswers;
        const successRate =
          totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

        return {
          questionNumber: index + 1,
          questionText: question.questionText,
          questionType: question.questionType,
          correctAnswers,
          incorrectAnswers,
          totalAnswers,
          successRate,
        };
      });

      report.questionAnalysis = questionAnalysis;
    }

    // Add time analysis if requested
    if (options.includeTimeAnalysis) {
      const timeAnalysis = {
        averageSubmissionTime: 0,
        fastestSubmission: null,
        slowestSubmission: null,
        submissionTimes: [],
      };

      if (filteredSubmissions.length > 0) {
        const submissionTimes = filteredSubmissions.map((submission) => {
          const submittedAt = new Date(submission.submittedAt);
          const createdAt = new Date(quiz.createdAt);
          return Math.abs(submittedAt - createdAt) / (1000 * 60 * 60); // Hours
        });

        timeAnalysis.submissionTimes = submissionTimes;
        timeAnalysis.averageSubmissionTime =
          submissionTimes.reduce((sum, time) => sum + time, 0) /
          submissionTimes.length;
        timeAnalysis.fastestSubmission = Math.min(...submissionTimes);
        timeAnalysis.slowestSubmission = Math.max(...submissionTimes);
      }

      report.timeAnalysis = timeAnalysis;
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating quiz report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating report",
    });
  }
};

// Export report as PDF
export const exportReportPDF = async (req, res) => {
  try {
    // This would require a PDF generation library like puppeteer or jsPDF
    // For now, we'll return a JSON response indicating PDF generation
    res.json({
      success: true,
      message:
        "PDF export functionality will be implemented with a PDF library",
    });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting PDF",
    });
  }
};

// Export report as Excel
export const exportReportExcel = async (req, res) => {
  try {
    // This would require an Excel generation library like exceljs
    // For now, we'll return a JSON response indicating Excel generation
    res.json({
      success: true,
      message:
        "Excel export functionality will be implemented with an Excel library",
    });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting Excel",
    });
  }
};
