import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const StudentQuizAnalytics = () => {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/quiz/student/${userId}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAnalytics(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في جلب التحليلات");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [getToken, userId]);

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

  // Check if there are no completed quizzes
  const hasCompletedQuizzes = analytics?.completedQuizzes && analytics.completedQuizzes.length > 0;

  if (!hasCompletedQuizzes) {
    return (
      <Box p={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          تحليلات الاختبارات
        </Typography>
        <Card>
          <CardContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <Typography variant="h6" color="textSecondary" gutterBottom>
                لا توجد اختبارات مكتملة بعد
              </Typography>
              <Typography variant="body1" color="textSecondary" textAlign="center">
                عندما تقوم بإجراء اختبارات في الدورات المسجلة، ستظهر تحليلاتك هنا
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        تحليلات الاختبارات
      </Typography>

      <Grid container spacing={3}>
        {/* عرض الكويزات التي تم إجراؤها */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                الكويزات التي تم إجراؤها
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>عنوان الكويز</TableCell>
                      <TableCell>المقرر</TableCell>
                      <TableCell>المدرس</TableCell>
                      <TableCell>الدرجة</TableCell>
                      <TableCell>النسبة المئوية</TableCell>
                      <TableCell>تاريخ الإجراء</TableCell>
                      <TableCell>الحالة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analytics?.completedQuizzes || []).map((quiz, index) => (
                      <TableRow key={index}>
                        <TableCell>{quiz.title}</TableCell>
                        <TableCell>
                          {quiz.course?.title || "غير محدد"}
                        </TableCell>
                        <TableCell>
                          {quiz.instructor
                            ? `${quiz.instructor.firstName} ${quiz.instructor.lastName}`
                            : "غير محدد"}
                        </TableCell>
                        <TableCell>
                          {quiz.score} من {quiz.totalMarks}
                        </TableCell>
                        <TableCell>{quiz.percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          {new Date(quiz.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={
                              quiz.percentage >= 60
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {quiz.percentage >= 60 ? "ناجح" : "راسب"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* تقدم الدرجات */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                تقدم الدرجات
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.scoreProgress || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      name="الدرجة"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* توزيع الدرجات */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                توزيع الدرجات
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.scoreDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {(analytics?.scoreDistribution || []).map(
                        (entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* إحصائيات عامة */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                إحصائيات عامة
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      متوسط الدرجات
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.averageScore || 0}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      نسبة النجاح
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.passRate || 0}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      عدد المحاولات
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.totalAttempts || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      متوسط الوقت
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.averageTime || 0} دقيقة
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentQuizAnalytics;
