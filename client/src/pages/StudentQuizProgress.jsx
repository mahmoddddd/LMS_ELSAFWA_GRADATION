import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Card,
  CardContent,
} from "@mui/material";
import NavigationButtons from "../components/NavigationButtons";

const StudentQuizProgress = () => {
  const { courseId } = useParams();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/quiz/course/${courseId}/progress`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProgress(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في جلب التقدم");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
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
    <Box p={3}>
      <NavigationButtons />
      <Typography variant="h4" component="h1" gutterBottom>
        تقدمي في الاختبارات
      </Typography>

      <Grid container spacing={3}>
        {/* ملخص التقدم */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ملخص التقدم
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  متوسط الدرجات
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress.averageScore}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {progress.averageScore}%
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  نسبة الإكمال
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress.completionRate}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {progress.completionRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* إحصائيات مفصلة */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                إحصائيات مفصلة
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    عدد الاختبارات المكتملة
                  </Typography>
                  <Typography variant="h4">
                    {progress.completedQuizzes}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    عدد الاختبارات المتبقية
                  </Typography>
                  <Typography variant="h4">
                    {progress.remainingQuizzes}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    أعلى درجة
                  </Typography>
                  <Typography variant="h4">{progress.highestScore}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    أدنى درجة
                  </Typography>
                  <Typography variant="h4">{progress.lowestScore}%</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* آخر التقديمات */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                آخر التقديمات
              </Typography>
              {progress.recentSubmissions.map((submission) => (
                <Box key={submission._id} mb={2}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1">
                      {submission.quiz.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(submission.submittedAt).toLocaleDateString(
                        "ar-SA"
                      )}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress
                      variant="determinate"
                      value={submission.score}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">{submission.score}%</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentQuizProgress;
