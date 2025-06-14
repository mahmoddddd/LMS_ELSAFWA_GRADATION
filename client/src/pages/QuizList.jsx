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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
          `${import.meta.env.VITE_API_URL}/api/quiz/course/${courseId}`,
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
        {userRole === "educator" && (
          <Button
            component={Link}
            to={`/courses/${courseId}/quizzes/create`}
            variant="contained"
            color="primary"
            size={isMobile ? "small" : "medium"}
          >
            إنشاء اختبار جديد
          </Button>
        )}
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={6} lg={4} key={quiz._id}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ padding: isMobile ? "16px" : "24px" }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  gutterBottom
                >
                  {quiz.title}
                </Typography>
                <Typography
                  color="textSecondary"
                  paragraph
                  sx={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {quiz.description}
                </Typography>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  flexDirection={isMobile ? "column" : "row"}
                  gap={isMobile ? 1 : 0}
                  alignItems={isMobile ? "flex-start" : "center"}
                >
                  <Typography variant="body2">
                    الدرجة الكلية: {quiz.totalMarks}
                  </Typography>
                  <Chip
                    label={quiz.isActive ? "نشط" : "غير نشط"}
                    color={quiz.isActive ? "success" : "default"}
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                >
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
