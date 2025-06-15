import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CourseQuizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [startQuizDialogOpen, setStartQuizDialogOpen] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${backendUrl}/api/quiz/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQuizzes(response.data.quizzes);
    } catch (err) {
      setError("حدث خطأ في جلب الاختبارات");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setStartQuizDialogOpen(true);
  };

  const handleConfirmStartQuiz = () => {
    navigate(`/quiz/${selectedQuiz._id}/take`);
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    const dueDate = new Date(quiz.dueDate);

    if (now > dueDate) {
      return { label: "منتهي", color: "error" };
    }

    const submission = quiz.submission;
    if (submission) {
      return { label: "تم التقديم", color: "success" };
    }

    return { label: "متاح", color: "primary" };
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

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        اختبارات المقرر
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {quizzes.map((quiz) => {
          const status = getQuizStatus(quiz);
          return (
            <Grid item xs={12} md={6} key={quiz._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {quiz.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {quiz.description}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="body2">
                      تاريخ الاستحقاق:{" "}
                      {format(new Date(quiz.dueDate), "PPP", { locale: ar })}
                    </Typography>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2">
                      الدرجة الكلية: {quiz.totalMarks}
                    </Typography>
                    {quiz.submission ? (
                      <Typography variant="body2">
                        درجتك: {quiz.submission.grade || "قيد التقدير"}
                      </Typography>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleStartQuiz(quiz)}
                        disabled={status.color === "error"}
                      >
                        ابدأ الاختبار
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={startQuizDialogOpen}
        onClose={() => setStartQuizDialogOpen(false)}
      >
        <DialogTitle>بدء الاختبار</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            هل أنت متأكد من بدء الاختبار؟ بمجرد البدء، سيبدأ العد التنازلي.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            عنوان الاختبار: {selectedQuiz?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            عدد الأسئلة: {selectedQuiz?.questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            الدرجة الكلية: {selectedQuiz?.totalMarks}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartQuizDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleConfirmStartQuiz}
            variant="contained"
            color="primary"
          >
            ابدأ الاختبار
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseQuizzes;
