import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  const { courseId } = useParams();
  const { getToken } = useAuth();
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
          }/api/quiz/course/${courseId}/analytics`,
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
      <Typography variant="h4" component="h1" gutterBottom>
        تحليلات الاختبارات
      </Typography>

      <Grid container spacing={3}>
        {/* تقدم الدرجات */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                تقدم الدرجات
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.scoreProgress}>
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
                      data={analytics.scoreDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {analytics.scoreDistribution.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
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
                      {analytics.averageScore}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      نسبة النجاح
                    </Typography>
                    <Typography variant="h4">{analytics.passRate}%</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      عدد المحاولات
                    </Typography>
                    <Typography variant="h4">
                      {analytics.totalAttempts}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="textSecondary">
                      متوسط الوقت
                    </Typography>
                    <Typography variant="h4">
                      {analytics.averageTime} دقيقة
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* نقاط القوة والضعف */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                نقاط القوة والضعف
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "success.light" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      نقاط القوة
                    </Typography>
                    {analytics.strengths.map((strength, index) => (
                      <Typography key={index} variant="body2">
                        • {strength}
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "error.light" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      نقاط تحتاج تحسين
                    </Typography>
                    {analytics.weaknesses.map((weakness, index) => (
                      <Typography key={index} variant="body2">
                        • {weakness}
                      </Typography>
                    ))}
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
