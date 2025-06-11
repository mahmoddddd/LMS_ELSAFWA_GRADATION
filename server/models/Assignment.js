// import mongoose from "mongoose";

// const assignmentSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     course: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Course",
//       required: true,
//     },
//     instructor: {
//       type: String,
//       required: true,
//     },
//     dueDate: {
//       type: Date,
//       required: true,
//     },
//     totalMarks: {
//       type: Number,
//       required: true,
//     },
//     questions: [
//       {
//         questionText: {
//           type: String,
//           required: true,
//         },
//         questionType: {
//           type: String,
//           enum: ["text", "file"],
//           required: true,
//         },
//         marks: Number,
//         fileType: {
//           type: String,
//           enum: ["pdf", "doc", "docx", "txt", "image"],
//           default: null,
//         },
//       },
//     ],
//     submissions: [
//       {
//         student: {
//           type: String,
//           required: true,
//         },
//         answers: [
//           {
//             questionId: mongoose.Schema.Types.ObjectId,
//             textAnswer: String,
//             fileUrl: String,
//             fileType: String,
//           },
//         ],
//         score: Number,
//         feedback: String,
//         gradedBy: {
//           type: String,
//         },
//         gradedAt: Date,
//         submittedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Assignment = mongoose.model("Assignment", assignmentSchema);
// export default Assignment;
