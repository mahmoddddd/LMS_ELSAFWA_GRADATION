import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { backendUrl } from "../../../config";
import NavigationButtons from "../../../components/NavigationButtons";

const QuizDetail = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${backendUrl}/quiz/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-ID": userId,
          },
        });

        if (response.data.success) {
          setQuiz(response.data.quiz);
          // تهيئة الإجابات
          const initialAnswers = {};
          response.data.quiz.questions.forEach((q) => {
            initialAnswers[q._id] = q.type === "multiple_choice" ? "" : "";
          });
          setAnswers(initialAnswers);
        } else {
          setError(response.data.message || "حدث خطأ في جلب الاختبار");
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err.response?.data?.message || "حدث خطأ في جلب الاختبار");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, getToken, userId]);

  useEffect(() => {
    if (quiz) {
      const timer = setInterval(() => {
        const now = new Date();
        const dueDate = new Date(quiz.dueDate);
        const diff = dueDate - now;

        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(timer);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleFileChange = async (questionId, file) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${backendUrl}/quiz/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setAnswers({ ...answers, [questionId]: response.data.fileUrl });
    } catch (err) {
      setError("حدث خطأ في رفع الملف");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.post(
        `${backendUrl}/quiz/${quizId}/submit`,
        {
          answers,
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-ID": userId,
          },
        }
      );

      if (response.data.success) {
        navigate(`/courses/${courseId}/quizzes`);
      } else {
        setError(response.data.message || "حدث خطأ في تقديم الاختبار");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.response?.data?.message || "حدث خطأ في تقديم الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const formatTimeLeft = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Box p={3}>
      <NavigationButtons />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          {quiz.title}
        </Typography>
        <Typography variant="h6" color="error">
          الوقت المتبقي: {formatTimeLeft(timeLeft)}
        </Typography>
      </Box>

      <Typography variant="body1" paragraph>
        {quiz.description}
      </Typography>

      <Box mb={3}>
        <Typography variant="body2" color="textSecondary">
          تاريخ التسليم: {format(new Date(quiz.dueDate), "PPP", { locale: ar })}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          الدرجة الكلية: {quiz.totalScore}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {quiz.questions.map((question, index) => (
          <Grid item xs={12} key={question._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  السؤال {index + 1}
                </Typography>
                <Typography variant="body1" paragraph>
                  {question.text}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  الدرجة: {question.score}
                </Typography>

                {question.type === "multiple_choice" ? (
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={answers[question._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                    >
                      {question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ) : question.type === "text" ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                    placeholder="اكتب إجابتك هنا..."
                  />
                ) : (
                  <Box>
                    <input
                      type="file"
                      onChange={(e) =>
                        handleFileChange(question._id, e.target.files[0])
                      }
                    />
                    {answers[question._id] && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{ mt: 1 }}
                      >
                        تم رفع الملف بنجاح
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setConfirmDialog(true)}
          disabled={submitting}
          fullWidth
        >
          {submitting ? <CircularProgress size={24} /> : "تقديم الاختبار"}
        </Button>
      </Box>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>تأكيد تقديم الاختبار</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من تقديم الاختبار؟ لا يمكنك تعديل إجاباتك بعد التقديم.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            تأكيد التقديم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizDetail;
