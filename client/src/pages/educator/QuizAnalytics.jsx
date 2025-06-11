import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import {
  BarChart,
  Bar,
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

const QuizAnalytics = () => {
  const { quizId } = useParams();
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [quizId]);

  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:4000/api/quiz/${quizId}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalytics(response.data);
    } catch (err) {
      setError("حدث خطأ في جلب التحليلات");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const gradeDistribution = [
    { name: "ممتاز", value: analytics.gradeDistribution.excellent },
    { name: "جيد جداً", value: analytics.gradeDistribution.veryGood },
    { name: "جيد", value: analytics.gradeDistribution.good },
    { name: "مقبول", value: analytics.gradeDistribution.acceptable },
  ];

  const questionStats = analytics.questionStats.map((stat, index) => ({
    name: `سؤال ${index + 1}`,
    correct: stat.correctAnswers,
    incorrect: stat.incorrectAnswers,
  }));

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        تحليلات الاختبار
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                إجمالي التقديمات
              </Typography>
              <Typography variant="h3">{analytics.totalSubmissions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                متوسط الدرجات
              </Typography>
              <Typography variant="h3">
                {analytics.averageGrade.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                نسبة النجاح
              </Typography>
              <Typography variant="h3">{analytics.passRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper p={3}>
            <Typography variant="h6" gutterBottom>
              توزيع الدرجات
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Question Statistics Chart */}
        <Grid item xs={12} md={6}>
          <Paper p={3}>
            <Typography variant="h6" gutterBottom>
              إحصائيات الأسئلة
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="إجابات صحيحة" fill="#4CAF50" />
                  <Bar dataKey="incorrect" name="إجابات خاطئة" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuizAnalytics;
