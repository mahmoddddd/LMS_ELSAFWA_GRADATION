import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const QuizDetail = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/quiz/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuiz(response.data.quiz);

        // Initialize answers object
        const initialAnswers = {};
        response.data.quiz.questions.forEach((question) => {
          initialAnswers[question._id] = {
            answer: question.questionType === "multiple_choice" ? "" : "",
            file: null,
          };
        });
        setAnswers(initialAnswers);

        // Calculate time left
        const dueDate = new Date(response.data.quiz.dueDate);
        const now = new Date();
        const timeLeft = dueDate - now;
        setTimeLeft(timeLeft);
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في جلب الاختبار");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, getToken]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1000);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: value,
      },
    }));
  };

  const handleFileChange = async (questionId, file) => {
    if (!file) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        file,
      },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const formData = new FormData();

      // Add answers
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer.file) {
          formData.append(`files`, answer.file);
          formData.append(`answers[${questionId}][file]`, answer.file);
        }
        formData.append(`answers[${questionId}][answer]`, answer.answer);
      });

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/quiz/${quizId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      navigate(`/courses/${courseId}/quizzes`);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ في تقديم الاختبار");
    } finally {
      setSubmitting(false);
      setConfirmDialog(false);
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

  if (!quiz) {
    return null;
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            {quiz.title}
          </Typography>
          <Typography variant="h6" color="primary">
            الوقت المتبقي: {formatTimeLeft(timeLeft)}
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          {quiz.description}
        </Typography>

        <Box mb={3}>
          <LinearProgress
            variant="determinate"
            value={
              (timeLeft / (new Date(quiz.dueDate) - new Date(quiz.createdAt))) *
              100
            }
          />
        </Box>

        <Grid container spacing={3}>
          {quiz.questions.map((question, index) => (
            <Grid item xs={12} key={question._id}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  السؤال {index + 1}
                </Typography>
                <Typography variant="body1" paragraph>
                  {question.questionText}
                </Typography>

                {question.questionType === "multiple_choice" && (
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={answers[question._id]?.answer || ""}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                    >
                      {question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          value={option.text}
                          control={<Radio />}
                          label={option.text}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {question.questionType === "text" && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={answers[question._id]?.answer || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                    placeholder="اكتب إجابتك هنا..."
                  />
                )}

                {question.questionType === "file" && (
                  <Box>
                    <input
                      type="file"
                      accept={`.${question.fileType}`}
                      onChange={(e) =>
                        handleFileChange(question._id, e.target.files[0])
                      }
                      style={{ display: "none" }}
                      id={`file-upload-${question._id}`}
                    />
                    <label htmlFor={`file-upload-${question._id}`}>
                      <Button variant="outlined" component="span">
                        اختر ملف
                      </Button>
                    </label>
                    {answers[question._id]?.file && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        الملف المختار: {answers[question._id].file.name}
                      </Typography>
                    )}
                  </Box>
                )}

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 1 }}
                >
                  الدرجة: {question.marks}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmDialog(true)}
            disabled={submitting || timeLeft <= 0}
          >
            {submitting ? <CircularProgress size={24} /> : "تقديم الاختبار"}
          </Button>
        </Box>
      </Paper>

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
