import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Container,
  Chip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";

const QuizSubmissions = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const getGradeColor = (gradeText) => {
    console.log("Grade Text received:", gradeText);
    if (!gradeText) return "default";
    switch (gradeText) {
      case "ممتاز":
        return "success";
      case "جيد جداً":
        return "info";
      case "جيد":
        return "primary";
      case "مقبول":
        return "warning";
      case "راسب":
        return "error";
      default:
        console.log("Default case for grade:", gradeText);
        return "default";
    }
  };

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [gradingLoading, setGradingLoading] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [studentNames, setStudentNames] = useState({});

  useEffect(() => {
    if (!quizId) {
      setError("معرف الاختبار غير صالح");
      setLoading(false);
      return;
    }
    fetchSubmissions();
  }, [quizId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      console.log("Fetching submissions for quiz:", quizId);

      const response = await axios.get(
        `http://localhost:4000/api/quiz/${quizId}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Full Response:", response.data);

      if (response.data.success && response.data.statistics) {
        const submissionsData = response.data.statistics.submissions || [];
        console.log("Submissions Data:", submissionsData);

        setSubmissions(submissionsData);
        setQuiz(response.data.statistics.quiz);

        // Fetch student names for each submission
        const names = {};
        for (const submission of submissionsData) {
          try {
            const studentResponse = await axios.get(
              `http://localhost:4000/api/user/${submission.student}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            if (studentResponse.data.success) {
              names[submission.student] = studentResponse.data.user.name;
            } else {
              names[submission.student] = "طالب غير معروف";
            }
          } catch (err) {
            console.error("Error fetching student name:", err);
            names[submission.student] = "طالب غير معروف";
          }
        }
        setStudentNames(names);
      } else {
        console.log("No statistics data in response");
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError(err.response?.data?.message || "حدث خطأ في جلب التقديمات");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submission) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      console.log("=== Starting View Submission Process ===");
      console.log("Submission object:", submission);
      console.log("Quiz ID:", quizId);
      console.log("Student ID:", submission.student);

      const response = await axios.get(
        `http://localhost:4000/api/quiz/${quizId}/submissions/${submission.student}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("=== API Response ===");
      console.log("Full Response:", response);
      console.log("Response Data:", response.data);

      if (response.data.success) {
        const submissionData = response.data.submission;
        console.log("=== Processing Submission Data ===");
        console.log("Raw Submission Data:", submissionData);
        console.log("Answers Array:", submissionData.answers);

        // Log each answer's details
        submissionData.answers.forEach((answer, index) => {
          console.log(`=== Answer ${index + 1} Details ===`);
          console.log("Question Text:", answer.questionText);
          console.log("Student Answer:", answer.answer);
          console.log("Correct Answer:", answer.correctAnswer);
          console.log("Is Correct:", answer.isCorrect);
          console.log("Score:", answer.score);
          console.log("Max Score:", answer.maxScore);
          console.log("Feedback:", answer.feedback);
        });

        // Calculate percentage if not already present
        if (!submissionData.percentage) {
          submissionData.percentage =
            (submissionData.score / submissionData.totalMarks) * 100;
        }
        console.log("Calculated Percentage:", submissionData.percentage);

        // Determine grade text if not already present
        if (!submissionData.gradeText) {
          if (submissionData.percentage >= 90) {
            submissionData.gradeText = "ممتاز";
          } else if (submissionData.percentage >= 80) {
            submissionData.gradeText = "جيد جداً";
          } else if (submissionData.percentage >= 70) {
            submissionData.gradeText = "جيد";
          } else if (submissionData.percentage >= 60) {
            submissionData.gradeText = "مقبول";
          } else {
            submissionData.gradeText = "راسب";
          }
        }
        console.log("Final Grade Text:", submissionData.gradeText);

        // Set status if not already present
        if (!submissionData.status) {
          submissionData.status =
            submissionData.percentage >= 60 ? "ناجح" : "راسب";
        }
        console.log("Final Status:", submissionData.status);

        console.log("=== Final Processed Data ===");
        console.log("Complete Submission Data:", submissionData);

        setSubmissionDetails(submissionData);
        setViewDialogOpen(true);
      } else {
        console.error("API Error Response:", response.data);
        setError(response.data.message || "حدث خطأ في جلب تفاصيل التقديم");
      }
    } catch (err) {
      console.error("=== Error in handleViewSubmission ===");
      console.error("Error object:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);
      setError(err.response?.data?.message || "حدث خطأ في جلب تفاصيل التقديم");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    try {
      setGradingLoading(true);
      setError(null);
      const token = await getToken();

      const response = await axios.post(
        `http://localhost:4000/api/quiz/${quizId}/submissions/${selectedSubmission.student}/grade`,
        {
          grade: grade,
          feedback: feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((sub) =>
            sub.student === selectedSubmission.student
              ? {
                  ...sub,
                  score: grade,
                  feedback: feedback,
                  gradedAt: new Date(),
                  gradeText: response.data.submission.gradeText,
                }
              : sub
          )
        );
        setGradeDialogOpen(false);
        setGrade(0);
        setFeedback("");
      }
    } catch (err) {
      console.error("Error grading submission:", err);
      setError(err.response?.data?.message || "حدث خطأ في تقدير التقديم");
    } finally {
      setGradingLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تفاصيل التقديم</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .question { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .question-title { font-weight: bold; margin-bottom: 10px; }
            .answer { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
            .correct-answer { margin: 10px 0; padding: 10px; background-color: #e8f5e9; border-radius: 5px; }
            .score { margin: 10px 0; padding: 10px; background-color: #e3f2fd; border-radius: 5px; }
            .feedback { margin: 10px 0; padding: 10px; background-color: #fff3e0; border-radius: 5px; }
            .status { 
              margin: 10px 0; 
              padding: 10px; 
              background-color: ${
                submissionDetails.status === "ناجح" ? "#e8f5e9" : "#ffebee"
              }; 
              border-radius: 5px;
              color: ${
                submissionDetails.status === "ناجح" ? "#2e7d32" : "#c62828"
              };
              font-weight: bold;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تفاصيل التقديم</h1>
          </div>
          <div class="info">
            <h3>معلومات الطالب</h3>
            <p><strong>معرف الطالب:</strong> ${submissionDetails.student}</p>
            <p><strong>البريد الإلكتروني:</strong> ${submissionDetails.studentEmail ||
              "غير متوفر"}</p>
            <p><strong>اسم الكويز:</strong> ${submissionDetails.quizTitle}</p>
            <p><strong>تاريخ التقديم:</strong> ${new Date(
              submissionDetails.submittedAt
            ).toLocaleString("ar-SA")}</p>
            <p><strong>الدرجة:</strong> ${submissionDetails.score} من ${
      submissionDetails.totalMarks
    }</p>
            <p><strong>النسبة المئوية:</strong> ${submissionDetails.percentage.toFixed(
              2
            )}%</p>
            <p><strong>التقدير:</strong> ${submissionDetails.gradeText}</p>
            <div class="status">
              <strong>الحالة:</strong> ${submissionDetails.status}
            </div>
          </div>
          <div class="questions">
            <h3>تفاصيل الإجابات</h3>
            ${submissionDetails.answers
              .map(
                (answer, index) => `
              <div class="question">
                <div class="question-title">سؤال ${index + 1}</div>
                <div class="question-text">${answer.questionText}</div>
                <div class="answer">
                  <strong>إجابة الطالب:</strong><br>
                  ${
                    answer.questionType === "multiple_choice"
                      ? answer.answer.selectedOption || "لم يتم الإجابة"
                      : answer.answer.textAnswer || "لم يتم الإجابة"
                  }
                </div>
                <div class="correct-answer">
                  <strong>الإجابة الصحيحة:</strong><br>
                  ${answer.correctAnswer ||
                    answer.question?.correctAnswer ||
                    "غير متوفر"}
                </div>
                <div class="score">
                  <strong>الدرجة:</strong> ${answer.score} من ${answer.maxScore}
                </div>
                <div class="feedback">
                  <strong>التغذية الراجعة:</strong> ${answer.feedback}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/educator/quizzes")}
        >
          العودة إلى قائمة الاختبارات
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {quiz?.title} - تقديمات الاختبار
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الطالب</TableCell>
              <TableCell>الدرجة</TableCell>
              <TableCell>النسبة المئوية</TableCell>
              <TableCell>التقدير</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => {
              console.log("Rendering submission row:", submission); // Debug log
              return (
                <TableRow key={submission.student}>
                  <TableCell>
                    {studentNames[submission.student] || "طالب غير معروف"}
                  </TableCell>
                  <TableCell>
                    {submission.score} من {submission.totalMarks}
                  </TableCell>
                  <TableCell>{submission.percentage}%</TableCell>
                  <TableCell>
                    <Chip
                      label={submission.gradeText || "غير محدد"}
                      color={getGradeColor(submission.gradeText)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={submission.status || "غير محدد"}
                      color={submission.status === "ناجح" ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission(submission)}
                      startIcon={<VisibilityIcon />}
                    >
                      عرض التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#2196f3",
            color: "white",
            py: 2,
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          تفاصيل التقديم
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {submissionDetails && (
            <Box>
              <Box
                sx={{
                  mb: 4,
                  p: 2,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    color: "#2196f3",
                    fontWeight: "bold",
                    mb: 2,
                    textAlign: "center",
                  }}
                >
                  {submissionDetails.quizTitle}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "white",
                        borderRadius: 1,
                        height: "100%",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "#2196f3",
                          mb: 1,
                          fontWeight: "bold",
                        }}
                      >
                        معلومات الطالب
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>الاسم:</strong>{" "}
                        {submissionDetails.student?.name || "غير معروف"}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>البريد الإلكتروني:</strong>{" "}
                        {submissionDetails.student?.email || "غير متوفر"}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>تاريخ التقديم:</strong>{" "}
                        {new Date(submissionDetails.submittedAt).toLocaleString(
                          "ar-SA"
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "white",
                        borderRadius: 1,
                        height: "100%",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "#2196f3",
                          mb: 1,
                          fontWeight: "bold",
                        }}
                      >
                        النتيجة
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>الدرجة:</strong> {submissionDetails.score} من{" "}
                        {submissionDetails.totalMarks}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>النسبة المئوية:</strong>{" "}
                        {submissionDetails.percentage}%
                      </Typography>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <Typography variant="body1">
                          <strong>التقدير:</strong>
                        </Typography>
                        <Chip
                          label={submissionDetails.gradeText}
                          color={getGradeColor(submissionDetails.gradeText)}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          mt: 1,
                        }}
                      >
                        <Typography variant="body1">
                          <strong>الحالة:</strong>
                        </Typography>
                        <Chip
                          label={submissionDetails.status}
                          color={
                            submissionDetails.status === "ناجح"
                              ? "success"
                              : "error"
                          }
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {submissionDetails.answers &&
                submissionDetails.answers.length > 0 && (
                  <Box
                    sx={{
                      mt: 3,
                      bgcolor: "#f5f5f5",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        p: 2,
                        bgcolor: "#2196f3",
                        color: "white",
                        borderRadius: "8px 8px 0 0",
                        fontWeight: "bold",
                      }}
                    >
                      الإجابات
                    </Typography>
                    <List sx={{ p: 2 }}>
                      {submissionDetails.answers.map((answer, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            mb: 2,
                            bgcolor: "white",
                            borderRadius: 1,
                            flexDirection: "column",
                            alignItems: "flex-start",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: "#2196f3",
                              mb: 1,
                              fontWeight: "bold",
                            }}
                          >
                            السؤال {index + 1}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            {answer.questionText}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  width: "100%",
                                  p: 1,
                                  bgcolor: "#f5f5f5",
                                  borderRadius: 1,
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: "#2196f3",
                                    mb: 1,
                                    fontWeight: "bold",
                                  }}
                                >
                                  إجابة الطالب
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {typeof answer.answer === "object"
                                    ? answer.answer.selectedOption ||
                                      answer.answer.textAnswer ||
                                      "لم يتم الإجابة"
                                    : answer.answer || "لم يتم الإجابة"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: answer.isCorrect
                                      ? "#4caf50"
                                      : "#f44336",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {answer.isCorrect
                                    ? "✓ إجابة صحيحة"
                                    : "✗ إجابة خاطئة"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  width: "100%",
                                  p: 1,
                                  bgcolor: "#f5f5f5",
                                  borderRadius: 1,
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: "#2196f3",
                                    mb: 1,
                                    fontWeight: "bold",
                                  }}
                                >
                                  الإجابة الصحيحة
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {answer.correctAnswer || "غير متوفر"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#757575",
                                    fontStyle: "italic",
                                  }}
                                >
                                  الدرجة: {answer.score} من {answer.maxScore}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          {answer.feedback && (
                            <Box
                              sx={{
                                width: "100%",
                                mt: 1,
                                p: 1,
                                bgcolor: "#e3f2fd",
                                borderRadius: 1,
                                border: "1px solid #90caf9",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#2196f3",
                                  fontStyle: "italic",
                                }}
                              >
                                <strong>التغذية الراجعة:</strong>{" "}
                                {answer.feedback}
                              </Typography>
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: "#2196f3",
              "&:hover": {
                bgcolor: "#1976d2",
              },
            }}
          >
            طباعة
          </Button>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: "#2196f3",
              "&:hover": {
                bgcolor: "#1976d2",
              },
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizSubmissions;
