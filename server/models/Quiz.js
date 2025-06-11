import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructor: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 10, // مدة افتراضية 10 دقائق
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          enum: ["multiple_choice", "text", "file"],
          required: true,
        },
        options: [
          {
            text: String,
            isCorrect: Boolean,
          },
        ],
        marks: {
          type: Number,
          required: true,
        },
        fileUrl: {
          type: String,
          // رابط ملف PDF للسؤال (إذا كان نوع السؤال file)
        },
        fileId: {
          type: String,
          // معرف Cloudinary للملف
        },
        fileType: {
          type: String,
          enum: ["pdf", "doc", "docx"],
          // نوع الملف المسموح به
        },
        maxFileSize: {
          type: Number,
          default: 10, // الحد الأقصى لحجم الملف بالميجابايت
        },
      },
    ],
    submissions: [
      {
        student: {
          type: String,
          required: true,
        },
        answers: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            answer: {
              type: mongoose.Schema.Types.Mixed,
              required: true,
            },
            fileUrl: {
              type: String,
              // رابط ملف إجابة الطالب (إذا كان نوع السؤال file)
            },
            fileId: {
              type: String,
              // معرف Cloudinary للملف
            },
            fileName: {
              type: String,
              // اسم الملف الأصلي
            },
            fileSize: {
              type: Number,
              // حجم الملف بالميجابايت
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
            score: {
              type: Number,
              required: true,
            },
            feedback: {
              type: String,
              // تعليقات المدرس على الإجابة
            },
            gradedAt: {
              type: Date,
              // وقت تصحيح الإجابة
            },
            gradedBy: {
              type: String,
              // معرف المدرس الذي قام بالتصحيح
            },
          },
        ],
        score: {
          type: Number,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
