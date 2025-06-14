import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const QuizList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `http://localhost:4000/api/quiz/course/${courseId}`,
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
          setQuizzes(response.data.quizzes);
        } else {
          setError(response.data.message || "حدث خطأ في جلب الاختبارات");
        }
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(err.response?.data?.message || "حدث خطأ في جلب الاختبارات");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId, getToken, userId]);

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

  return (
    <Box p={isMobile ? 2 : 3}>
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        mb={3}
        gap={isMobile ? 2 : 0}
      >
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          الاختبارات
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/courses/${courseId}/quizzes/create`)}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          إنشاء اختبار جديد
        </Button>
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={6} lg={4} key={quiz._id}>
            <Card>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  gutterBottom
                >
                  {quiz.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  paragraph
                  sx={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }}
                >
                  {quiz.description}
                </Typography>
                <Box
                  display="flex"
                  flexDirection={isMobile ? "column" : "row"}
                  justifyContent="space-between"
                  alignItems={isMobile ? "flex-start" : "center"}
                  mb={2}
                  gap={isMobile ? 1 : 0}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                  >
                    تاريخ التسليم:{" "}
                    {format(new Date(quiz.dueDate), "PPP", { locale: ar })}
                  </Typography>
                  <Chip
                    label={`${quiz.totalScore} درجة`}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    sx={{ mt: isMobile ? 0.5 : 0 }}
                  />
                </Box>
                <Box
                  display="flex"
                  flexDirection={isMobile ? "column" : "row"}
                  justifyContent="space-between"
                  alignItems={isMobile ? "flex-start" : "center"}
                  gap={isMobile ? 1 : 0}
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                  >
                    عدد الأسئلة: {quiz.questions.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate(`/courses/${courseId}/quizzes/${quiz._id}`)
                    }
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                    sx={{ mt: isMobile ? 1 : 0 }}
                  >
                    عرض التفاصيل
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuizList;
