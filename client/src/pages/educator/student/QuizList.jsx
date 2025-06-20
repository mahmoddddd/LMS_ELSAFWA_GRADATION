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
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { backendUrl } from "../../../config";
import NavigationButtons from "../../../components/NavigationButtons";

const QuizList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${backendUrl}/quiz/course/${courseId}`,
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
    <Box p={3}>
      <NavigationButtons />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          الاختبارات
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/courses/${courseId}/quizzes/create`)}
        >
          إنشاء اختبار جديد
        </Button>
      </Box>

      <Grid container spacing={3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} md={6} lg={4} key={quiz._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {quiz.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {quiz.description}
                </Typography>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2">
                    تاريخ التسليم:{" "}
                    {format(new Date(quiz.dueDate), "PPP", { locale: ar })}
                  </Typography>
                  <Chip
                    label={`${quiz.totalScore} درجة`}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="textSecondary">
                    عدد الأسئلة: {quiz.questions.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate(`/courses/${courseId}/quizzes/${quiz._id}`)
                    }
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
