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
    isFileQuiz: {
      type: Boolean,
      default: false,
    },
    quizFile: {
      fileUrl: String,
      fileId: String,
      fileType: String,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: [true, "Question text is required"],
        },
        questionType: {
          type: String,
          enum: ["multiple_choice", "text", "file"],
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
        fileUrl: String,
        fileId: String,
        fileType: {
          type: [String],
          enum: ["pdf", "doc", "docx"],
          default: ["pdf"],
          // يسمح بأنواع ملفات متعددة للسؤال من نوع ملف
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
            questionText: {
              type: String,
              required: true,
            },
            answer: {
              selectedOption: String,
              textAnswer: String,
            },
            correctAnswer: {
              type: String,
              required: true,
            },
            score: {
              type: Number,
              required: true,
            },
            maxScore: {
              type: Number,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
            feedback: {
              type: String,
              default: "",
            },
          },
        ],
        score: {
          type: Number,
          required: true,
        },
        totalMarks: {
          type: Number,
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
        },
        gradeText: {
          type: String,
          enum: ["ممتاز", "جيد جداً", "جيد", "مقبول", "راسب"],
          required: true,
        },
        status: {
          type: String,
          enum: ["ناجح", "راسب"],
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
