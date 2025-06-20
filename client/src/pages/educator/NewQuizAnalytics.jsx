import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
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
import { useAuth } from "@clerk/clerk-react";
import * as XLSX from "xlsx";
import { AppContext } from "../../context/AppContext";
import DownloadIcon from "@mui/icons-material/Download";
import useMediaQuery from "@mui/material/useMediaQuery";

// This is a new component to force a change
const NewQuizAnalytics = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const { quizId } = useParams(); // Use quizId from URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const gradeDistributionData = stats
    ? [
        {
          name: "ممتاز (90-100%)",
          value: stats.gradeDistribution.excellent,
          color: "#4CAF50",
        },
        {
          name: "جيد جداً (80-89%)",
          value: stats.gradeDistribution.veryGood,
          color: "#8BC34A",
        },
        {
          name: "جيد (70-79%)",
          value: stats.gradeDistribution.good,
          color: "#FFC107",
        },
        {
          name: "مقبول (60-69%)",
          value: stats.gradeDistribution.acceptable,
          color: "#FF9800",
        },
        {
          name: "راسب (<60%)",
          value: stats.gradeDistribution.failed,
          color: "#F44336",
        },
      ]
    : [];

  useEffect(() => {
    const fetchQuizStats = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await axios.get(
          `${backendUrl}/api/quiz/${quizId}/statistics`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          setStats(response.data.statistics);
        } else {
          setError("Failed to load statistics.");
        }
      } catch (e) {
        setError(e.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizStats();
    }
  }, [quizId, getToken, backendUrl]);

  const exportToExcel = () => {
    if (!stats) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summary = [
      ["Title", "Value"],
      ["Quiz Title", stats.quiz.title],
      ["Total Submissions", stats.totalSubmissions],
      ["Total Students", stats.totalStudents],
      ["Average Score", `${stats.averageScore.toFixed(2)}%`],
      ["Pass Rate", `${stats.passRate.toFixed(2)}%`],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Grade Distribution
    const grades = gradeDistributionData.map((g) => [g.name, g.value]);
    grades.unshift(["Grade", "Count"]);
    const gradesWs = XLSX.utils.aoa_to_sheet(grades);
    XLSX.utils.book_append_sheet(wb, gradesWs, "Grade Distribution");

    // Submissions
    const submissions = stats.submissions.map((s) => [
      s.student,
      s.score,
      `${s.percentage}%`,
      s.status,
      s.submittedAt,
    ]);
    submissions.unshift([
      "Student ID",
      "Score",
      "Percentage",
      "Status",
      "Submitted At",
    ]);
    const subsWs = XLSX.utils.aoa_to_sheet(submissions);
    XLSX.utils.book_append_sheet(wb, subsWs, "Submissions");

    XLSX.writeFile(wb, `${stats.quiz.title}_Analytics.xlsx`);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats)
    return <Typography>No statistics found for this quiz.</Typography>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">{stats.quiz.title} - Analytics</Typography>
        <Button
          variant="contained"
          onClick={exportToExcel}
          startIcon={<DownloadIcon />}
        >
          Export to Excel
        </Button>
      </Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography>Total Submissions</Typography>
              <Typography variant="h4">{stats.totalSubmissions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography>Total Students</Typography>
              <Typography variant="h4">{stats.totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography>Average Score</Typography>
              <Typography variant="h4">
                {stats.averageScore.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography>Pass Rate</Typography>
              <Typography variant="h4">{stats.passRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Grade Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Submissions Table or Card List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">All Submissions</Typography>
              {isMobile ? (
                <Grid container spacing={2}>
                  {stats.submissions.map((sub, i) => (
                    <Grid item xs={12} key={i}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Student: {sub.student}
                        </Typography>
                        <Typography variant="body2">
                          Score: {sub.score} / {stats.quiz.totalMarks}
                        </Typography>
                        <Typography variant="body2">
                          Percentage: {sub.percentage}%
                        </Typography>
                        <Typography variant="body2">
                          Status:{" "}
                          <Chip
                            label={sub.status}
                            color={sub.status === "ناجح" ? "success" : "error"}
                            size="small"
                          />
                        </Typography>
                        <Typography variant="body2">
                          Date: {new Date(sub.submittedAt).toLocaleString()}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Percentage</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.submissions.map((sub, i) => (
                        <TableRow key={i}>
                          <TableCell>{sub.student}</TableCell>
                          <TableCell>
                            {sub.score} / {stats.quiz.totalMarks}
                          </TableCell>
                          <TableCell>{sub.percentage}%</TableCell>
                          <TableCell>
                            <Chip
                              label={sub.status}
                              color={
                                sub.status === "ناجح" ? "success" : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(sub.submittedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NewQuizAnalytics;
