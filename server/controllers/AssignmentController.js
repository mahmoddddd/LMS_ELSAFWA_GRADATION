// import Assignment from "../models/Assignment.js";
// import Course from "../models/Course.js";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// // Helper function to extract Clerk user ID from authorization header
// const extractClerkUserId = (authHeader) => {
//   if (!authHeader) return null;
//   // Assuming Bearer token format
//   const token = authHeader.replace("Bearer ", "");
//   // You might need to decode the token to get the user ID
//   // This depends on your authentication setup
//   return token; // Simplified - adjust based on your token structure
// };
//
// // Get user's full assignment data including all submissions and progress
// export const getUserFullAssignmentData = async (req, res) => {
//   try {
//     const clerkId = extractClerkUserId(req.headers.authorization);
//     const userId = req.auth;
//     console.log("auth userId", userId);

//     if (!clerkId)
//       return res
//         .status(401)
//         .json({ success: false, message: "Unauthorized: Clerk ID not found" });

//     // Get all assignments where user has submissions
//     const assignments = await Assignment.find({
//       "submissions.student": clerkId,
//     })
//       .populate("course", "title description")
//       .lean();

//     if (!assignments || assignments.length === 0)
//       return res
//         .status(404)
//         .json({ success: false, message: "No assignment data found" });

//     // Process user's submission data for each assignment
//     const userAssignmentData = assignments.map((assignment) => {
//       const userSubmission = assignment.submissions.find(
//         (sub) => sub.student === clerkId
//       );

//       return {
//         assignment: {
//           _id: assignment._id,
//           title: assignment.title,
//           description: assignment.description,
//           course: assignment.course,
//           dueDate: assignment.dueDate,
//           totalMarks: assignment.totalMarks,
//           createdAt: assignment.createdAt,
//         },
//         submission: userSubmission || null,
//         status: userSubmission ? "submitted" : "pending",
//       };
//     });

//     res.json({ success: true, userAssignmentData });
//   } catch (error) {
//     console.error("Error in getUserFullAssignmentData:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get user's assignment data with role synchronization
// export const getUserAssignmentData = async (req, res) => {
//   try {
//     const userId = req.auth?.userId;
//     extractClerkUserId(req.headers.authorization);
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     console.log("🔍 Getting user assignment data for:", userId);

//     // Get assignments based on user role
//     let assignments;

//     try {
//       const clerkUser = await clerkClient.users.getUser(userId);
//       const clerkRole = clerkUser.publicMetadata?.role;

//       if (clerkRole === "educator") {
//         // Get assignments created by this educator
//         assignments = await Assignment.find({ instructor: userId })
//           .populate("course", "title")
//           .sort({ createdAt: -1 });
//       } else {
//         // Get assignments where student has submissions or can submit
//         assignments = await Assignment.find({
//           $or: [
//             { "submissions.student": userId },
//             { course: { $exists: true } }, // All assignments in courses user might be enrolled in
//           ],
//         })
//           .populate("course", "title")
//           .sort({ createdAt: -1 });
//       }

//       if (!assignments || assignments.length === 0)
//         return res
//           .status(404)
//           .json({ success: false, message: "No assignments found" });

//       res.json({ success: true, assignments, role: clerkRole });
//     } catch (clerkError) {
//       console.error(
//         "⚠️ Warning: Could not get user role from Clerk:",
//         clerkError.message
//       );

//       // Fallback: get all assignments
//       assignments = await Assignment.find({})
//         .populate("course", "title")
//         .sort({ createdAt: -1 });

//       res.json({ success: true, assignments, role: "unknown" });
//     }
//   } catch (error) {
//     console.error("❌ Error getting user assignment data:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get user's assignments for enrolled courses
// export const userAssignmentsInCourses = async (req, res) => {
//   try {
//     const userId = req.auth?.userId;
//     extractClerkUserId(req.headers.authorization);

//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     // First, get user's enrolled courses (assuming you have a User model)
//     // If you don't have User model, you might need to pass course IDs as parameters
//     const { courseIds } = req.body; // or get from User model

//     if (!courseIds || courseIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No course IDs provided",
//       });
//     }

//     // Get all assignments for the user's enrolled courses
//     const assignments = await Assignment.find({
//       course: { $in: courseIds },
//     })
//       .populate({
//         path: "course",
//         select: "title description educator",
//         populate: { path: "educator", select: "name email imageUrl" },
//       })
//       .sort({ createdAt: -1 });

//     if (!assignments || assignments.length === 0)
//       return res.status(404).json({
//         success: false,
//         message: "No assignments found for enrolled courses",
//       });

//     // Add submission status for each assignment
//     const assignmentsWithStatus = assignments.map((assignment) => {
//       const userSubmission = assignment.submissions.find(
//         (sub) => sub.student === userId
//       );

//       return {
//         ...assignment.toObject(),
//         userSubmission: userSubmission || null,
//         submissionStatus: userSubmission ? "submitted" : "pending",
//         isOverdue: new Date() > new Date(assignment.dueDate),
//         canSubmit:
//           new Date() <= new Date(assignment.dueDate) && !userSubmission,
//       };
//     });

//     res.json({ success: true, assignments: assignmentsWithStatus });
//   } catch (error) {
//     console.error("Error in userAssignmentsInCourses:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get detailed assignment statistics for user
// export const getUserAssignmentStats = async (req, res) => {
//   try {
//     const userId = req.auth?.userId;
//     extractClerkUserId(req.headers.authorization);

//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     // Get all assignments where user has submissions
//     const assignments = await Assignment.find({
//       "submissions.student": userId,
//     });

//     const stats = {
//       totalAssignments: 0,
//       submittedAssignments: 0,
//       pendingAssignments: 0,
//       overdueAssignments: 0,
//       totalScore: 0,
//       maxPossibleScore: 0,
//       averageScore: 0,
//       submissionHistory: [],
//     };

//     const currentDate = new Date();

//     // Get all assignments user has access to (you might need to modify this logic)
//     const allAccessibleAssignments = await Assignment.find({
//       // Add your logic to determine which assignments user can access
//       // This might depend on course enrollment
//     });

//     stats.totalAssignments = allAccessibleAssignments.length;

//     allAccessibleAssignments.forEach((assignment) => {
//       const userSubmission = assignment.submissions.find(
//         (sub) => sub.student === userId
//       );

//       stats.maxPossibleScore += assignment.totalMarks;

//       if (userSubmission) {
//         stats.submittedAssignments++;
//         stats.totalScore += userSubmission.score || 0;
//         stats.submissionHistory.push({
//           assignmentId: assignment._id,
//           assignmentTitle: assignment.title,
//           submittedAt: userSubmission.submittedAt,
//           score: userSubmission.score || 0,
//           maxScore: assignment.totalMarks,
//         });
//       } else {
//         if (currentDate > new Date(assignment.dueDate)) {
//           stats.overdueAssignments++;
//         } else {
//           stats.pendingAssignments++;
//         }
//       }
//     });

//     stats.averageScore =
//       stats.maxPossibleScore > 0
//         ? (stats.totalScore / stats.maxPossibleScore) * 100
//         : 0;

//     // Sort submission history by date
//     stats.submissionHistory.sort((a, b) => b.submittedAt - a.submittedAt);

//     res.json({ success: true, stats });
//   } catch (error) {
//     console.error("Error in getUserAssignmentStats:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get user's assignment dashboard data
// export const getUserAssignmentDashboard = async (req, res) => {
//   try {
//     const userId = req.auth?.userId;
//     extractClerkUserId(req.headers.authorization);

//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     const currentDate = new Date();

//     // Get recent assignments (last 30 days)
//     const recentAssignments = await Assignment.find({
//       createdAt: { $gte: new Date(currentDate - 30 * 24 * 60 * 60 * 1000) },
//     })
//       .populate("course", "title")
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get upcoming assignments (due in next 7 days)
//     const upcomingAssignments = await Assignment.find({
//       dueDate: {
//         $gte: currentDate,
//         $lte: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
//       },
//       "submissions.student": { $ne: userId },
//     })
//       .populate("course", "title")
//       .sort({ dueDate: 1 })
//       .limit(5);

//     // Get overdue assignments
//     const overdueAssignments = await Assignment.find({
//       dueDate: { $lt: currentDate },
//       "submissions.student": { $ne: userId },
//     })
//       .populate("course", "title")
//       .sort({ dueDate: -1 })
//       .limit(5);

//     // Get user's recent submissions
//     const recentSubmissions = await Assignment.find({
//       "submissions.student": userId,
//       "submissions.submittedAt": {
//         $gte: new Date(currentDate - 30 * 24 * 60 * 60 * 1000),
//       },
//     })
//       .populate("course", "title")
//       .sort({ "submissions.submittedAt": -1 })
//       .limit(5);

//     const dashboardData = {
//       recentAssignments: recentAssignments.map((assignment) => ({
//         _id: assignment._id,
//         title: assignment.title,
//         course: assignment.course,
//         dueDate: assignment.dueDate,
//         totalMarks: assignment.totalMarks,
//         createdAt: assignment.createdAt,
//       })),
//       upcomingAssignments: upcomingAssignments.map((assignment) => ({
//         _id: assignment._id,
//         title: assignment.title,
//         course: assignment.course,
//         dueDate: assignment.dueDate,
//         totalMarks: assignment.totalMarks,
//       })),
//       overdueAssignments: overdueAssignments.map((assignment) => ({
//         _id: assignment._id,
//         title: assignment.title,
//         course: assignment.course,
//         dueDate: assignment.dueDate,
//         totalMarks: assignment.totalMarks,
//       })),
//       recentSubmissions: recentSubmissions.map((assignment) => {
//         const userSubmission = assignment.submissions.find(
//           (sub) => sub.student === userId
//         );
//         return {
//           assignmentId: assignment._id,
//           title: assignment.title,
//           course: assignment.course,
//           submittedAt: userSubmission.submittedAt,
//           score: userSubmission.score || 0,
//           totalMarks: assignment.totalMarks,
//         };
//       }),
//     };

//     res.json({ success: true, dashboardData });
//   } catch (error) {
//     console.error("Error in getUserAssignmentDashboard:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Create a new assignment
// export const createAssignment = async (req, res) => {
//   try {
//     const userId = req.auth?.userId;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const { title, description, courseId, dueDate, totalMarks } = req.body;

//     // Verify course exists
//     const course = await Course.findById(courseId);
//     if (!course) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Course not found" });
//     }

//     const assignment = await Assignment.create({
//       title,
//       description,
//       course: courseId,
//       instructor: userId,
//       dueDate,
//       totalMarks,
//       submissions: [],
//     });

//     res.status(201).json({
//       success: true,
//       assignment,
//     });
//   } catch (error) {
//     console.error("Error creating assignment:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get all assignments for a course
// export const getCourseAssignments = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const assignments = await Assignment.find({ course: courseId })
//       .populate("course", "title")
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       assignments,
//     });
//   } catch (error) {
//     console.error("Error getting course assignments:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get a single assignment
// export const getAssignment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const assignment = await Assignment.findById(id).populate(
//       "course",
//       "title"
//     );

//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     res.json({
//       success: true,
//       assignment,
//     });
//   } catch (error) {
//     console.error("Error getting assignment:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Update an assignment
// export const updateAssignment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     // Check if user is the instructor
//     if (assignment.instructor !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to update this assignment",
//       });
//     }

//     const updatedAssignment = await Assignment.findByIdAndUpdate(id, req.body, {
//       new: true,
//     });

//     res.json({
//       success: true,
//       assignment: updatedAssignment,
//     });
//   } catch (error) {
//     console.error("Error updating assignment:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Delete an assignment
// export const deleteAssignment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     // Check if user is the instructor
//     if (assignment.instructor !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to delete this assignment",
//       });
//     }

//     await assignment.deleteOne();

//     res.json({
//       success: true,
//       message: "Assignment deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting assignment:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Submit an assignment
// export const submitAssignment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;
//     const { answers } = req.body;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     // Check if due date has passed
//     if (new Date() > new Date(assignment.dueDate)) {
//       return res.status(400).json({
//         success: false,
//         message: "Assignment submission deadline has passed",
//       });
//     }

//     // Check if student has already submitted
//     const existingSubmission = assignment.submissions.find(
//       (sub) => sub.student === userId
//     );
//     if (existingSubmission) {
//       return res.status(400).json({
//         success: false,
//         message: "You have already submitted this assignment",
//       });
//     }

//     // Add submission
//     assignment.submissions.push({
//       student: userId,
//       answers,
//       submittedAt: new Date(),
//     });

//     await assignment.save();

//     res.json({
//       success: true,
//       message: "Assignment submitted successfully",
//     });
//   } catch (error) {
//     console.error("Error submitting assignment:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get student's submission for an assignment
// export const getStudentSubmission = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     const submission = assignment.submissions.find(
//       (sub) => sub.student === userId
//     );

//     if (!submission) {
//       return res
//         .status(404)
//         .json({ success: false, message: "No submission found" });
//     }

//     res.json({
//       success: true,
//       submission,
//     });
//   } catch (error) {
//     console.error("Error getting student submission:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get student's progress in a course
// export const getStudentProgress = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignments = await Assignment.find({ course: courseId });

//     const progress = {
//       totalAssignments: assignments.length,
//       submittedAssignments: 0,
//       totalScore: 0,
//       maxPossibleScore: 0,
//     };

//     assignments.forEach((assignment) => {
//       const submission = assignment.submissions.find(
//         (sub) => sub.student === userId
//       );

//       if (submission) {
//         progress.submittedAssignments++;
//         progress.totalScore += submission.score || 0;
//       }

//       progress.maxPossibleScore += assignment.totalMarks;
//     });

//     res.json({
//       success: true,
//       progress,
//     });
//   } catch (error) {
//     console.error("Error getting student progress:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get student's submission history
// export const getStudentSubmissionHistory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     const submissions = assignment.submissions.filter(
//       (sub) => sub.student === userId
//     );

//     res.json({
//       success: true,
//       submissions,
//     });
//   } catch (error) {
//     console.error("Error getting submission history:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Check if student is eligible to submit an assignment
// export const checkSubmissionEligibility = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.auth?.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Assignment not found" });
//     }

//     // Check if student has already submitted
//     const existingSubmission = assignment.submissions.find(
//       (sub) => sub.student === userId
//     );

//     // Check if due date has passed
//     const isOverdue = new Date() > new Date(assignment.dueDate);

//     res.json({
//       success: true,
//       canSubmit: !existingSubmission && !isOverdue,
//       isOverdue,
//       hasSubmitted: !!existingSubmission,
//       dueDate: assignment.dueDate,
//     });
//   } catch (error) {
//     console.error("Error checking submission eligibility:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
