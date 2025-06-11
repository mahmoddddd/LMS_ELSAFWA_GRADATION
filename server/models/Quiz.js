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
          required: [true, "Question text is required"],
        },
        questionType: {
          type: String,
          enum: ["multiple_choice", "text"],
          required: [true, "Question type is required"],
        },
        options: [
          {
            text: String,
            isCorrect: Boolean,
          },
        ],
        marks: {
          type: Number,
          required: [true, "Marks are required"],
          min: [0, "Marks cannot be negative"],
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
        correctAnswer: {
          type: String,
          default: "",
          validate: {
            validator: function (v) {
              // Only validate if question type is text
              if (this.questionType === "text") {
                return v && v.length > 0;
              }
              return true;
            },
            message: "Correct answer is required for text questions",
          },
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
        feedback: {
          type: String,
          // تعليقات المدرس على التقديم
        },
        gradedAt: {
          type: Date,
          // وقت تصحيح التقديم
        },
        gradedBy: {
          type: String,
          // معرف المدرس الذي قام بالتصحيح
        },
        gradeText: {
          type: String,
          enum: ["ممتاز", "جيد جداً", "جيد", "مقبول", "راسب"],
          // التقدير النصي للتقديم
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
