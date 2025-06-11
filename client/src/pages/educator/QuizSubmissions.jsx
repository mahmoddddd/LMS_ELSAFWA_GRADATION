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

      // تحويل الدرجة من 10 إلى النسبة المئوية
      const percentageGrade = (grade / 10) * 100;

      const response = await axios.post(
        `http://localhost:4000/api/quiz/${quizId}/submissions/${selectedSubmission.student}/grade`,
        {
          grade: percentageGrade,
          feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setGradeDialogOpen(false);
        setGrade(0);
        setFeedback("");
        await fetchSubmissions(); // تحديث قائمة التقديمات
      } else {
        setError(response.data.message || "حدث خطأ في تقدير التقديم");
      }
    } catch (err) {
      console.error("Error grading submission:", err);
      setError(err.response?.data?.message || "حدث خطأ في تقدير التقديم");
    } finally {
      setGradingLoading(false);
    }
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
                <TableCell>الطالب</TableCell>
                <TableCell>الدرجة</TableCell>
                <TableCell>تاريخ التقديم</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.student}>
                  <TableCell>{submission.student}</TableCell>
                  <TableCell>{submission.score}</TableCell>
                  <TableCell>
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </TableCell>
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
        <DialogTitle>تفاصيل التقديم</DialogTitle>
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

                          {answer.options && answer.options.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: "primary.main",
                                  fontWeight: "bold",
                                  mb: 1,
                                }}
                              >
                                الخيارات المتاحة:
                              </Typography>
                              <Box
                                sx={{
                                  display: "grid",
                                  gap: 1,
                                  gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "1fr 1fr",
                                  },
                                }}
                              >
                                {answer.options.map((option, optIndex) => (
                                  <Box
                                    key={optIndex}
                                    sx={{
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: option.isCorrect
                                        ? "success.light"
                                        : "grey.100",
                                      border: option.isCorrect
                                        ? "2px solid"
                                        : "1px solid",
                                      borderColor: option.isCorrect
                                        ? "success.main"
                                        : "grey.300",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: option.isCorrect
                                          ? "success.dark"
                                          : "text.primary",
                                        fontWeight: option.isCorrect
                                          ? "bold"
                                          : "normal",
                                      }}
                                    >
                                      {option.text}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: "grey.50",
                                  borderRadius: 2,
                                  height: "100%",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    color: "primary.main",
                                    fontWeight: "bold",
                                    mb: 1,
                                  }}
                                >
                                  إجابة الطالب:
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    bgcolor: "white",
                                    p: 1.5,
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "grey.300",
                                  }}
                                >
                                  {answer.answer}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: "success.light",
                                  borderRadius: 2,
                                  height: "100%",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    color: "success.dark",
                                    fontWeight: "bold",
                                    mb: 1,
                                  }}
                                >
                                  الإجابة الصحيحة:
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    bgcolor: "white",
                                    p: 1.5,
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "success.main",
                                  }}
                                >
                                  {answer.correctAnswer}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: "grey.50",
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    color: "primary.main",
                                    fontWeight: "bold",
                                    mb: 1,
                                  }}
                                >
                                  الدرجة:
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: "primary.main",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {answer.score} من {answer.maxScore}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: answer.isCorrect
                                    ? "success.light"
                                    : "error.light",
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    color: answer.isCorrect
                                      ? "success.dark"
                                      : "error.dark",
                                    fontWeight: "bold",
                                    mb: 1,
                                  }}
                                >
                                  الحالة:
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: answer.isCorrect
                                      ? "success.dark"
                                      : "error.dark",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {answer.isCorrect
                                    ? "إجابة صحيحة"
                                    : "إجابة خاطئة"}
                                </Typography>
                              </Box>
                            </Grid>

                            {answer.feedback && (
                              <Grid item xs={12}>
                                <Box
                                  sx={{
                                    p: 2,
                                    bgcolor: "warning.light",
                                    borderRadius: 2,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      color: "warning.dark",
                                      fontWeight: "bold",
                                      mb: 1,
                                    }}
                                  >
                                    التعليقات:
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      bgcolor: "white",
                                      p: 1.5,
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "warning.main",
                                    }}
                                  >
                                    {answer.feedback}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
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
