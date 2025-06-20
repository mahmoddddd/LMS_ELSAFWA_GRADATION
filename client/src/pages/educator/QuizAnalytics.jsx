import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
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
  LineChart,
  Line,
} from "recharts";
import { AppContext } from "../../context/AppContext";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import useMediaQuery from "@mui/material/useMediaQuery";

const QuizAnalytics = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [courses, setCourses] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch all courses for the educator
      const coursesResponse = await axios.get(
        `${backendUrl}/api/educator/courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (coursesResponse.data.success) {
        setCourses(coursesResponse.data.courses);
      }

      // Fetch aggregated analytics data
      const analyticsResponse = await axios.get(
        `${backendUrl}/api/quiz/educator/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (analyticsResponse.data.success) {
        console.log(
          "📊 Analytics data received:",
          analyticsResponse.data.analytics
        );
        setAnalyticsData(analyticsResponse.data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const exportData = () => {
    if (!analyticsData) return;

    const data = {
      summary: {
        totalQuizzes: analyticsData.totalQuizzes,
        totalSubmissions: analyticsData.totalSubmissions,
        totalStudents: analyticsData.totalStudents,
        averageScore: analyticsData.averageScore.toFixed(2),
        passRate: analyticsData.passRate.toFixed(2),
      },
      courseStats: analyticsData.courseStats,
      gradeDistribution: analyticsData.gradeDistribution,
      topPerformingQuizzes: analyticsData.topPerformingQuizzes,
      monthlyStats: analyticsData.monthlyStats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-analytics.json";
    a.click();
    URL.revokeObjectURL(url);
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!analyticsData || analyticsData.totalQuizzes === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              No Quiz Data Available
            </Typography>
            <Typography variant="body1" align="center" color="textSecondary">
              You haven't created any quizzes yet. Create some quizzes to see
              analytics data.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const gradeDistributionData = [
    {
      name: "ممتاز",
      value: analyticsData.gradeDistribution.excellent,
      color: "#4CAF50",
      fullName: "ممتاز (90-100%)",
    },
    {
      name: "جيد جداً",
      value: analyticsData.gradeDistribution.veryGood,
      color: "#8BC34A",
      fullName: "جيد جداً (80-89%)",
    },
    {
      name: "جيد",
      value: analyticsData.gradeDistribution.good,
      color: "#FFC107",
      fullName: "جيد (70-79%)",
    },
    {
      name: "مقبول",
      value: analyticsData.gradeDistribution.acceptable,
      color: "#FF9800",
      fullName: "مقبول (60-69%)",
    },
    {
      name: "راسب",
      value: analyticsData.gradeDistribution.failed,
      color: "#F44336",
      fullName: "راسب (<60%)",
    },
  ];

  const monthlyData = Object.entries(analyticsData.monthlyStats)
    .map(([month, stats]) => ({
      month,
      submissions: stats.submissions || 0,
      averageScore: stats.averageScore || 0,
    }))
    .filter((item) => item.submissions > 0 || item.averageScore > 0)
    .sort((a, b) => {
      // Sort chronologically by month
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const aMonth = a.month.split(" ")[0];
      const bMonth = b.month.split(" ")[0];
      const aYear = parseInt(a.month.split(" ")[1]);
      const bYear = parseInt(b.month.split(" ")[1]);

      if (aYear !== bYear) return aYear - bYear;
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });

  const coursePerformanceData = Object.entries(analyticsData.courseStats).map(
    ([courseId, stats]) => ({
      course: stats.courseTitle,
      averageScore: stats.averageScore,
      passRate: stats.passRate,
      submissions: stats.totalSubmissions,
    })
  );

  console.log("📊 Processed data:", {
    gradeDistributionData,
    monthlyData,
    coursePerformanceData,
    topPerformingQuizzes: analyticsData.topPerformingQuizzes,
  });

  console.log("📅 Monthly Stats Raw Data:", analyticsData.monthlyStats);
  console.log("📈 Monthly Data Processed:", monthlyData);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Quiz Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportData}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Quizzes
              </Typography>
              <Typography variant="h4" component="div">
                {analyticsData.totalQuizzes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4" component="div">
                {analyticsData.totalSubmissions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h4" component="div">
                {analyticsData.totalStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h4" component="div">
                {analyticsData.averageScore.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pass Rate
              </Typography>
              <Typography variant="h4" component="div">
                {analyticsData.passRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={4} mb={4}>
        {/* Grade Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grade Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 400}>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent, value }) =>
                      value > 0 ? `${name}\n${(percent * 100).toFixed(0)}%` : ""
                    }
                    outerRadius={120}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} طالب`,
                      props.payload.fullName,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => entry.payload.fullName}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Submissions Line Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Submissions Trend
              </Typography>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "submissions"
                          ? `${value} تسليم`
                          : `${value.toFixed(1)}%`,
                        name === "submissions"
                          ? "عدد التسليمات"
                          : "متوسط الدرجات",
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) =>
                        value === "submissions"
                          ? "عدد التسليمات"
                          : "متوسط الدرجات"
                      }
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="submissions"
                      stroke="#8884d8"
                      name="submissions"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="averageScore"
                      stroke="#82ca9d"
                      name="averageScore"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height={400}
                  color="text.secondary"
                >
                  <Typography variant="h6" gutterBottom>
                    لا توجد بيانات شهرية متاحة
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    عندما يتم تسليم الكويزات، ستظهر البيانات هنا
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Course Performance Bar Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Performance
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 500}>
                <BarChart
                  data={coursePerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="course"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value.toFixed(1)}%`,
                      name === "averageScore" ? "متوسط الدرجات" : "نسبة النجاح",
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) =>
                      value === "averageScore" ? "متوسط الدرجات" : "نسبة النجاح"
                    }
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#8884d8"
                    name="Average Score (%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="passRate"
                    fill="#82ca9d"
                    name="Pass Rate (%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performing Quizzes Table or Card List */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Performing Quizzes
          </Typography>
          {isMobile ? (
            <Grid container spacing={2}>
              {analyticsData.topPerformingQuizzes.map((quiz, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {quiz.title}
                    </Typography>
                    <Typography variant="body2">
                      Course: {quiz.courseTitle}
                    </Typography>
                    <Typography variant="body2">
                      Avg Score: {quiz.averageScore.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      Submissions: {quiz.submissions}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quiz Title</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell align="right">Average Score</TableCell>
                    <TableCell align="right">Submissions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.topPerformingQuizzes.map((quiz, index) => (
                    <TableRow key={index}>
                      <TableCell>{quiz.title}</TableCell>
                      <TableCell>{quiz.courseTitle}</TableCell>
                      <TableCell align="right">
                        {quiz.averageScore.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">{quiz.submissions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Course Statistics Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Course Statistics
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell align="right">Total Quizzes</TableCell>
                  <TableCell align="right">Total Submissions</TableCell>
                  <TableCell align="right">Average Score</TableCell>
                  <TableCell align="right">Pass Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(analyticsData.courseStats).map(
                  ([courseId, stats]) => (
                    <TableRow key={courseId}>
                      <TableCell>{stats.courseTitle}</TableCell>
                      <TableCell align="right">{stats.totalQuizzes}</TableCell>
                      <TableCell align="right">
                        {stats.totalSubmissions}
                      </TableCell>
                      <TableCell align="right">
                        {stats.averageScore.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${stats.passRate.toFixed(1)}%`}
                          color={
                            stats.passRate >= 70
                              ? "success"
                              : stats.passRate >= 50
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default QuizAnalytics;
