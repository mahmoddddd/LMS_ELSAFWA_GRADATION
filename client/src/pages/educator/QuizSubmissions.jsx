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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";

const QuizSubmissions = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
        setSubmissions(response.data.statistics.submissions || []);
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
            <p><strong>معرف الطالب:</strong> ${submissionDetails.student}</p>
            <p><strong>تاريخ التقديم:</strong> ${new Date(
              submissionDetails.submittedAt
            ).toLocaleString()}</p>
            <p><strong>الدرجة:</strong> ${submissionDetails.score}</p>
            <p><strong>التقدير:</strong> ${submissionDetails.gradeText ||
              "لم يتم التقدير"}</p>
          </div>
          <h2>تفاصيل الإجابات</h2>
          ${submissionDetails.answers
            ?.map(
              (answer, index) => `
            <div class="question">
              <div class="question-title">سؤال ${index + 1}</div>
              <p>${answer.questionText}</p>
              <div class="answer">
                <strong>إجابة الطالب:</strong><br>
                ${answer.answer}
              </div>
              ${
                answer.correctAnswer
                  ? `
                <div class="correct-answer">
                  <strong>الإجابة الصحيحة:</strong><br>
                  ${answer.correctAnswer}
                </div>
              `
                  : ""
              }
              <div class="score">
                <strong>الدرجة:</strong><br>
                ${answer.score} من ${answer.maxScore}
              </div>
              ${
                answer.feedback
                  ? `
                <div class="feedback">
                  <strong>التعليقات:</strong><br>
                  ${answer.feedback}
                </div>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
          <div class="no-print">
            <button onclick="window.print()">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        تقديمات الاختبار
      </Typography>

      {submissions.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            لا توجد تقديمات حتى الآن
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/educator/quizzes")}
            sx={{ mt: 2 }}
          >
            العودة إلى قائمة الاختبارات
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>معرف الطالب</TableCell>
                <TableCell>الدرجة</TableCell>
                <TableCell>التقدير</TableCell>
                <TableCell>تاريخ التقديم</TableCell>
                <TableCell>تاريخ التقدير</TableCell>
                <TableCell>التعليقات</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.student}>
                  <TableCell>{submission.student}</TableCell>
                  <TableCell>{submission.score}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color:
                          submission.gradeText === "ممتاز"
                            ? "success.main"
                            : submission.gradeText === "جيد جداً"
                            ? "info.main"
                            : submission.gradeText === "جيد"
                            ? "primary.main"
                            : submission.gradeText === "مقبول"
                            ? "warning.main"
                            : "error.main",
                        fontWeight: "bold",
                      }}
                    >
                      {submission.gradeText || "لم يتم التقدير"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {submission.gradedAt
                      ? new Date(submission.gradedAt).toLocaleDateString()
                      : "لم يتم التقدير"}
                  </TableCell>
                  <TableCell>{submission.feedback || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewSubmission(submission)}
                      sx={{ mr: 1 }}
                    >
                      عرض
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setGradeDialogOpen(true);
                      }}
                    >
                      تقدير
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* نافذة عرض تفاصيل التقديم */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">تفاصيل التقديم</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              طباعة
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {submissionDetails && (
            <Box>
              <Typography variant="h6" gutterBottom>
                معلومات الطالب
              </Typography>
              <Typography>معرف الطالب: {submissionDetails.student}</Typography>
              <Typography>
                تاريخ التقديم:{" "}
                {new Date(submissionDetails.submittedAt).toLocaleString()}
              </Typography>
              <Typography>الدرجة: {submissionDetails.score}</Typography>
              <Typography>
                التقدير:{" "}
                <Typography
                  component="span"
                  sx={{
                    color:
                      submissionDetails.gradeText === "ممتاز"
                        ? "success.main"
                        : submissionDetails.gradeText === "جيد جداً"
                        ? "info.main"
                        : submissionDetails.gradeText === "جيد"
                        ? "primary.main"
                        : submissionDetails.gradeText === "مقبول"
                        ? "warning.main"
                        : "error.main",
                    fontWeight: "bold",
                  }}
                >
                  {submissionDetails.gradeText || "لم يتم التقدير"}
                </Typography>
              </Typography>
              {submissionDetails.feedback && (
                <Typography>التعليقات: {submissionDetails.feedback}</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}
              >
                تفاصيل الإجابات
              </Typography>
              <List>
                {submissionDetails.answers?.map((answer, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      mb: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      boxShadow: 1,
                      p: 2,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                              bgcolor: "primary.main",
                              color: "white",
                              p: 1,
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold" }}
                            >
                              سؤال {index + 1}
                            </Typography>
                          </Box>

                          <Typography
                            variant="body1"
                            sx={{
                              mb: 2,
                              fontWeight: "medium",
                              fontSize: "1.1rem",
                              color: "text.primary",
                            }}
                          >
                            {answer.questionText}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: "bold", mb: 1 }}
                            >
                              إجابة الطالب:
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                p: 2,
                                bgcolor: "grey.100",
                                borderRadius: 1,
                              }}
                            >
                              {answer.answer}
                            </Typography>
                          </Box>

                          {answer.correctAnswer && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: "bold", mb: 1 }}
                              >
                                الإجابة الصحيحة:
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  p: 2,
                                  bgcolor: "success.light",
                                  color: "success.dark",
                                  borderRadius: 1,
                                }}
                              >
                                {answer.correctAnswer}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: "bold", mb: 1 }}
                            >
                              الدرجة:
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                p: 2,
                                bgcolor: "primary.light",
                                color: "primary.dark",
                                borderRadius: 1,
                              }}
                            >
                              {answer.score} من {answer.maxScore}
                            </Typography>
                          </Box>

                          {answer.feedback && (
                            <Box>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: "bold", mb: 1 }}
                              >
                                التعليقات:
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  p: 2,
                                  bgcolor: "warning.light",
                                  color: "warning.dark",
                                  borderRadius: 1,
                                }}
                              >
                                {answer.feedback}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تقدير التقديم */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)}>
        <DialogTitle>تقدير التقديم</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography gutterBottom>الدرجة:</Typography>
            <Rating
              value={grade}
              onChange={(event, newValue) => setGrade(newValue)}
              max={10}
            />
            <Typography variant="body2" color="textSecondary" mt={1}>
              {grade > 0 && (
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      color:
                        grade >= 9
                          ? "success.main"
                          : grade >= 8
                          ? "info.main"
                          : grade >= 7
                          ? "primary.main"
                          : grade >= 6
                          ? "warning.main"
                          : "error.main",
                      fontWeight: "bold",
                    }}
                  >
                    {grade >= 9
                      ? "ممتاز"
                      : grade >= 8
                      ? "جيد جداً"
                      : grade >= 7
                      ? "جيد"
                      : grade >= 6
                      ? "مقبول"
                      : "راسب"}
                  </Typography>
                </Box>
              )}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography gutterBottom>التعليقات:</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleGradeSubmission}
            variant="contained"
            color="primary"
            disabled={gradingLoading}
          >
            {gradingLoading ? <CircularProgress size={24} /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizSubmissions;
