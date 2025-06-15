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
  Chip,
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, "dd/MM/yyyy 'في' hh:mm a", { locale: ar });
};

const StudentQuizAnalytics = () => {
  console.log("🎯 StudentQuizAnalytics component rendered");

  const { getToken, userId } = useAuth();
  console.log("🔑 Auth context:", { userId, hasToken: !!getToken });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [instructorNames, setInstructorNames] = useState({});

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Function to fetch instructor names from Clerk
  const fetchInstructorNames = async (instructorIds) => {
    try {
      const token = await getToken();
      const uniqueIds = [...new Set(instructorIds)];
      const names = {};

      for (const id of uniqueIds) {
        const response = await axios.get(
          `https://api.clerk.dev/v1/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
            },
          }
        );
        names[id] = {
          firstName: response.data.first_name,
          lastName: response.data.last_name,
        };
      }

      setInstructorNames(names);
    } catch (error) {
      console.error("Error fetching instructor names:", error);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered");
    console.log("📊 Current state:", { loading, error, analytics });

    const fetchAnalytics = async () => {
      console.log("🚀 Starting fetchAnalytics");
      try {
        if (!userId) {
          console.log("⏳ Waiting for userId...");
          return;
        }

        console.log("👤 Fetching analytics for user:", userId);
        const token = await getToken();
        console.log("🔐 Token received:", token ? "Yes" : "No");
        const url = `${backendUrl}/api/quiz/student/${userId}/analytics`;
        console.log("🌐 API URL:", url);

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-ID": userId,
          },
        });

        console.log("📥 API Response:", response.data);

        if (response.data) {
          console.log("✅ Analytics data received:", response.data);
          setAnalytics(response.data);
          setError(null);

          // Extract instructor IDs and fetch their names
          const instructorIds = response.data.completedQuizzes.map(
            (quiz) => quiz.instructor
          );
          await fetchInstructorNames(instructorIds);
        } else {
          console.error("❌ API returned no data");
          setError("لم يتم العثور على بيانات التحليلات");
        }
      } catch (err) {
        console.error("💥 Error fetching analytics:", err);
        console.error("🔍 Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(err.response?.data?.message || "حدث خطأ في جلب التحليلات");
      } finally {
        console.log("🏁 Fetch operation completed");
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [getToken, userId]);

  // Log analytics state changes
  useEffect(() => {
    console.log("📈 Analytics state updated:", analytics);
  }, [analytics]);

  // Show loading state while waiting for userId
  if (!userId) {
    console.log("⏳ Waiting for userId...");
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

  if (loading) {
    console.log("⏳ Rendering loading state");
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
    console.log("❌ Rendering error state:", error);
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Log before rendering
  console.log("🎨 Rendering component with data:", {
    analytics,
    completedQuizzes: analytics?.completedQuizzes,
    scoreProgress: analytics?.scoreProgress,
    scoreDistribution: analytics?.scoreDistribution,
  });

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        تحليلات الاختبارات
      </Typography>

      <Grid container spacing={3}>
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
                    {(analytics?.completedQuizzes || []).map((quiz, index) => {
                      console.log("📝 Rendering quiz:", quiz);
                      return (
                        <TableRow key={`${quiz.title}-${index}`}>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>
                            {quiz.course?.title || "غير محدد"}
                          </TableCell>
                          <TableCell>
                            {quiz.instructor?.firstName
                              ? `${quiz.instructor.firstName} ${quiz.instructor
                                  .lastName || ""}`
                              : "غير محدد"}
                          </TableCell>
                          <TableCell>
                            {quiz.score} من {quiz.totalMarks}
                          </TableCell>
                          <TableCell>{quiz.percentage.toFixed(1)}%</TableCell>
                          <TableCell>{formatDate(quiz.submittedAt)}</TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                color:
                                  quiz.percentage >= 60 ? "#1B5E20" : "#B71C1C",
                                fontWeight: "bold",
                                textAlign: "center",
                                backgroundColor:
                                  quiz.percentage >= 60 ? "#C8E6C9" : "#FFCDD2",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                display: "inline-block",
                                minWidth: "80px",
                              }}
                            >
                              {quiz.percentage >= 60 ? "ناجح" : "راسب"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                  <LineChart
                    data={
                      analytics?.scoreProgress?.map((item) => ({
                        ...item,
                        date: formatDate(item.date),
                      })) || []
                    }
                  >
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
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>
                      متوسط الدرجات
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {analytics.averageScore.toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>
                      نسبة النجاح
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {(
                        (analytics.completedQuizzes.filter(
                          (quiz) => quiz.percentage >= 60
                        ).length /
                          analytics.completedQuizzes.length) *
                        100
                      ).toFixed(1)}
                      %
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>
                      عدد المحاولات
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {analytics.completedQuizzes.length}
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
