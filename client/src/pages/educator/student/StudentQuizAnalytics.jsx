import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/AppContext";
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
  Button,
  Chip,
  Tabs,
  Tab,
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
  const navigate = useNavigate();
  const { backendUrl, enrolledCourses, fetchUserEnrolledCourses } = useContext(
    AppContext
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [dataFetched, setDataFetched] = useState(false);

  // Memoize the fetch function to prevent infinite loops
  const fetchData = useCallback(async () => {
    if (!userId || enrolledCourses.length === 0 || dataFetched) {
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Starting to fetch quiz data...");
      console.log("📚 Enrolled courses:", enrolledCourses);

      const token = await getToken();

      // Fetch completed quiz analytics
      console.log("📊 Fetching analytics...");
      const analyticsResponse = await axios.get(
        `${backendUrl}/api/quiz/student/${userId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("📊 Analytics response:", analyticsResponse.data);
      setAnalytics(analyticsResponse.data);

      // Fetch available quizzes from enrolled courses
      console.log(
        "🎯 Fetching available quizzes from",
        enrolledCourses.length,
        "courses..."
      );
      const availableQuizzesData = [];

      for (const course of enrolledCourses) {
        try {
          console.log(
            `🔍 Fetching quizzes for course: ${course.courseTitle} (${course._id})`
          );
          const quizResponse = await axios.get(
            `${backendUrl}/api/quiz/course/${course._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log(
            `📝 Quiz response for ${course.courseTitle}:`,
            quizResponse.data
          );

          if (
            quizResponse.data.success &&
            quizResponse.data.quizzes.length > 0
          ) {
            // Check which quizzes the student hasn't completed yet
            const courseQuizzes = quizResponse.data.quizzes.map((quiz) => {
              const submission = quiz.submissions?.find(
                (sub) => sub.student === userId
              );
              const quizData = {
                ...quiz,
                courseTitle: course.courseTitle,
                courseId: course._id,
                isCompleted: !!submission,
                submission: submission || null,
              };
              console.log(`🎯 Quiz: ${quiz.title}, Completed: ${!!submission}`);
              return quizData;
            });

            availableQuizzesData.push(...courseQuizzes);
          } else {
            console.log(
              `❌ No quizzes found for course: ${course.courseTitle}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error fetching quizzes for course ${course._id}:`,
            error
          );
        }
      }

      console.log("✅ Final available quizzes:", availableQuizzesData);
      setAvailableQuizzes(availableQuizzesData);
      setDataFetched(true);
    } catch (err) {
      console.error("💥 Error in fetchData:", err);
      setError(err.response?.data?.message || "حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [userId, enrolledCourses, backendUrl, getToken, dataFetched]);

  // Load enrolled courses first
  useEffect(() => {
    if (userId && !dataFetched) {
      fetchUserEnrolledCourses();
    }
  }, [userId, fetchUserEnrolledCourses, dataFetched]);

  // Fetch quiz data when enrolled courses are loaded
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTakeQuiz = (quiz) => {
    console.log("🚀 Taking quiz:", quiz);
    navigate(`/quiz/${quiz._id}/take`);
  };

  const handleViewQuiz = (quiz) => {
    console.log("👁️ Viewing quiz:", quiz);
    navigate(`/course/${quiz.courseId}/quizzes`);
  };

  // Show loading only if we're actually loading and haven't fetched data yet
  if (loading && !dataFetched) {
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

  const hasCompletedQuizzes =
    analytics?.completedQuizzes && analytics.completedQuizzes.length > 0;
  const hasAvailableQuizzes = availableQuizzes.length > 0;

  console.log("🎨 Rendering with data:", {
    hasCompletedQuizzes,
    hasAvailableQuizzes,
    availableQuizzesCount: availableQuizzes.length,
    completedQuizzesCount: analytics?.completedQuizzes?.length || 0,
    dataFetched,
    loading,
  });

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Quizzes
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Available Quizzes" />
        <Tab label="Completed Quizzes" />
        <Tab label="Analytics" />
      </Tabs>

      {/* Available Quizzes Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Quizzes from Your Enrolled Courses
                </Typography>
                {hasAvailableQuizzes ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Quiz Title</TableCell>
                          <TableCell>Course</TableCell>
                          <TableCell>Total Marks</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableQuizzes.map((quiz, index) => (
                          <TableRow key={index}>
                            <TableCell>{quiz.title}</TableCell>
                            <TableCell>{quiz.courseTitle}</TableCell>
                            <TableCell>{quiz.totalMarks}</TableCell>
                            <TableCell>
                              {new Date(quiz.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  quiz.isCompleted ? "Completed" : "Available"
                                }
                                color={quiz.isCompleted ? "success" : "primary"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {quiz.isCompleted ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewQuiz(quiz)}
                                >
                                  View Results
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleTakeQuiz(quiz)}
                                >
                                  Take Quiz
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                  >
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No quizzes available
                    </Typography>
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      textAlign="center"
                    >
                      You don't have any quizzes available from your enrolled
                      courses yet.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      textAlign="center"
                      sx={{ mt: 2 }}
                    >
                      Debug Info: {enrolledCourses.length} enrolled courses
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Completed Quizzes Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Quizzes
                </Typography>
                {hasCompletedQuizzes ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Quiz Title</TableCell>
                          <TableCell>Course</TableCell>
                          <TableCell>Instructor</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Percentage</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(analytics?.completedQuizzes || []).map(
                          (quiz, index) => (
                            <TableRow key={index}>
                              <TableCell>{quiz.title}</TableCell>
                              <TableCell>
                                {quiz.course?.title || "Unknown"}
                              </TableCell>
                              <TableCell>
                                {quiz.instructor
                                  ? `${quiz.instructor.firstName} ${quiz.instructor.lastName}`
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                {quiz.score} of {quiz.totalMarks}
                              </TableCell>
                              <TableCell>
                                {quiz.percentage.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  quiz.submittedAt
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Typography
                                  color={
                                    quiz.percentage >= 60
                                      ? "success.main"
                                      : "error.main"
                                  }
                                >
                                  {quiz.percentage >= 60 ? "Passed" : "Failed"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                  >
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No completed quizzes yet
                    </Typography>
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      textAlign="center"
                    >
                      When you complete quizzes in your enrolled courses, they
                      will appear here.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {tabValue === 2 && hasCompletedQuizzes && (
        <Grid container spacing={3}>
          {/* Score Progress Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Score Progress
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
                        name="Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Score Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Score Distribution
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

          {/* General Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  General Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                      <Typography variant="body2" color="textSecondary">
                        Average Score
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.averageScore || 0}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                      <Typography variant="body2" color="textSecondary">
                        Pass Rate
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.passRate || 0}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                      <Typography variant="body2" color="textSecondary">
                        Total Attempts
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.totalAttempts || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100" }}>
                      <Typography variant="body2" color="textSecondary">
                        Average Time
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.averageTime || 0} min
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Show message if no analytics available */}
      {tabValue === 2 && !hasCompletedQuizzes && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
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
                    No analytics available
                  </Typography>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    textAlign="center"
                  >
                    Complete some quizzes to see your analytics and progress
                    charts.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StudentQuizAnalytics;
