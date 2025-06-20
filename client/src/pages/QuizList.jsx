import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import NavigationButtons from "../components/NavigationButtons";

const QuizList = () => {
  const { courseId } = useParams();
  const { getToken } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/quiz/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuizzes(response.data.quizzes);
        setUserRole(response.data.userRole);
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في جلب الاختبارات");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId, getToken]);

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
    <Box p={isMobile ? 1 : 3}>
      <NavigationButtons />
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent={isMobile ? "flex-start" : "space-between"}
        alignItems={isMobile ? "stretch" : "center"}
        mb={isMobile ? 2 : 3}
        gap={isMobile ? 2 : 0}
      >
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          الاختبارات
        </Typography>
        {userRole === "educator" && (
          <Button
            component={Link}
            to={`/courses/${courseId}/quizzes/create`}
            variant="contained"
            color="primary"
            fullWidth={isMobile}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            إنشاء اختبار جديد
          </Button>
        )}
      </Box>
      <Grid container spacing={isMobile ? 1 : 3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} sm={12} md={6} lg={4} key={quiz._id}>
            <Card sx={{ mb: isMobile ? 1 : 0 }}>
              <CardContent>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  gutterBottom
                >
                  {quiz.title}
                </Typography>
                <Typography
                  color="textSecondary"
                  paragraph
                  sx={{ fontSize: isMobile ? "0.95rem" : "1rem" }}
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
                  <Typography variant="body2">
                    الدرجة الكلية: {quiz.totalMarks}
                  </Typography>
                  <Chip
                    label={quiz.isActive ? "نشط" : "غير نشط"}
                    color={quiz.isActive ? "success" : "default"}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  تاريخ التسليم:{" "}
                  {format(new Date(quiz.dueDate), "PPP", { locale: ar })}
                </Typography>
                <Box mt={2}>
                  <Button
                    component={Link}
                    to={`/courses/${courseId}/quizzes/${quiz._id}`}
                    variant="outlined"
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                  >
                    {userRole === "educator" ? "عرض التفاصيل" : "بدء الاختبار"}
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
