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

      console.log("Response:", response.data);

      if (response.data.success && response.data.statistics) {
        const submissionsData = response.data.statistics.submissions || [];
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

      const response = await axios.get(
        `http://localhost:4000/api/quiz/${quizId}/submissions/${submission.student}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSubmissionDetails(response.data.submission);
        setViewDialogOpen(true);
      } else {
        setError(response.data.message || "حدث خطأ في جلب تفاصيل التقديم");
      }
    } catch (err) {
      console.error("Error fetching submission details:", err);
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
                  ${answer.correctAnswer}
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
      <Typography variant="h4" gutterBottom>
        تقديمات الاختبار
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الطالب</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.student}>
                    <TableCell>
                      {studentNames[submission.student] || "جاري التحميل..."}
                    </TableCell>
                    <TableCell>
                      <Button
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewSubmission(submission)}
                      >
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog
            open={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>تفاصيل التقديم</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 2 }}>
                {submissionDetails && (
                  <div
                    className="submission-details"
                    style={{
                      maxWidth: "800px",
                      margin: "0 auto",
                      padding: "20px",
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <h3
                      style={{
                        textAlign: "center",
                        color: "#1976d2",
                        marginBottom: "24px",
                        fontSize: "24px",
                        borderBottom: "2px solid #1976d2",
                        paddingBottom: "12px",
                      }}
                    >
                      تفاصيل التقديم
                    </h3>

                    <div
                      className="student-info"
                      style={{
                        backgroundColor: "#f5f5f5",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                      }}
                    >
                      <p style={{ margin: "8px 0" }}>
                        <strong style={{ color: "#1976d2" }}>الطالب:</strong>{" "}
                        {submissionDetails.student?.name || "غير معروف"}
                      </p>
                      <p style={{ margin: "8px 0" }}>
                        <strong style={{ color: "#1976d2" }}>
                          البريد الإلكتروني:
                        </strong>{" "}
                        {submissionDetails.student?.email || "غير معروف"}
                      </p>
                      <p style={{ margin: "8px 0" }}>
                        <strong style={{ color: "#1976d2" }}>
                          تاريخ التقديم:
                        </strong>{" "}
                        {submissionDetails.submittedAt
                          ? new Date(
                              submissionDetails.submittedAt
                            ).toLocaleString("ar-SA")
                          : "غير معروف"}
                      </p>
                    </div>

                    <div
                      className="score-info"
                      style={{
                        backgroundColor: "#e3f2fd",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ margin: "8px 0", fontSize: "18px" }}>
                        <strong style={{ color: "#1976d2" }}>الدرجة:</strong>{" "}
                        {submissionDetails.score || 0} من{" "}
                        {submissionDetails.totalMarks || 0}
                      </p>
                      <p style={{ margin: "8px 0", fontSize: "18px" }}>
                        <strong style={{ color: "#1976d2" }}>
                          النسبة المئوية:
                        </strong>{" "}
                        {submissionDetails.percentage
                          ? submissionDetails.percentage.toFixed(1)
                          : 0}
                        %
                      </p>
                      <p style={{ margin: "8px 0", fontSize: "18px" }}>
                        <strong style={{ color: "#1976d2" }}>التقدير:</strong>{" "}
                        {submissionDetails.gradeText || "لم يتم التقدير"}
                      </p>
                      <p style={{ margin: "8px 0", fontSize: "18px" }}>
                        <strong style={{ color: "#1976d2" }}>الحالة:</strong>{" "}
                        <span
                          className={`status ${
                            submissionDetails.status === "تم التقدير"
                              ? "success"
                              : ""
                          }`}
                          style={{
                            backgroundColor:
                              submissionDetails.status === "تم التقدير"
                                ? "#4caf50"
                                : "#f44336",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "16px",
                            fontSize: "14px",
                          }}
                        >
                          {submissionDetails.status || "لم يتم التقدير"}
                        </span>
                      </p>
                    </div>

                    {submissionDetails.answers &&
                      submissionDetails.answers.length > 0 && (
                        <div
                          className="answers-section"
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "16px",
                            borderRadius: "8px",
                          }}
                        >
                          <h4
                            style={{
                              textAlign: "center",
                              color: "#1976d2",
                              marginBottom: "20px",
                              fontSize: "20px",
                              borderBottom: "2px solid #1976d2",
                              paddingBottom: "8px",
                            }}
                          >
                            الإجابات
                          </h4>
                          {submissionDetails.answers.map((answer, index) => (
                            <div
                              key={answer.questionId}
                              className="answer-item"
                              style={{
                                backgroundColor: "white",
                                padding: "16px",
                                borderRadius: "8px",
                                marginBottom: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }}
                            >
                              <p style={{ margin: "8px 0", fontSize: "16px" }}>
                                <strong style={{ color: "#1976d2" }}>
                                  السؤال {index + 1}:
                                </strong>{" "}
                                {answer.questionText}
                              </p>
                              <p style={{ margin: "8px 0", fontSize: "16px" }}>
                                <strong style={{ color: "#1976d2" }}>
                                  إجابة الطالب:
                                </strong>{" "}
                                {answer.answer?.selectedOption ||
                                  answer.answer?.textAnswer ||
                                  "لم يتم الإجابة"}
                              </p>
                              <p style={{ margin: "8px 0", fontSize: "16px" }}>
                                <strong style={{ color: "#1976d2" }}>
                                  الإجابة الصحيحة:
                                </strong>{" "}
                                {answer.correctAnswer}
                              </p>
                              <p style={{ margin: "8px 0", fontSize: "16px" }}>
                                <strong style={{ color: "#1976d2" }}>
                                  الدرجة:
                                </strong>{" "}
                                {answer.score || 0} من {answer.maxScore || 0}
                              </p>
                              {answer.feedback && (
                                <p
                                  style={{ margin: "8px 0", fontSize: "16px" }}
                                >
                                  <strong style={{ color: "#1976d2" }}>
                                    التغذية الراجعة:
                                  </strong>{" "}
                                  {answer.feedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>إغلاق</Button>
              <Button onClick={handlePrint} startIcon={<PrintIcon />}>
                طباعة
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default QuizSubmissions;
