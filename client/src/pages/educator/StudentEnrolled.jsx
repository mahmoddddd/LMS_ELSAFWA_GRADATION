import React, { useContext, useEffect, useState } from "react";
import Loading from "../../components/student/Loading";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import useMediaQuery from "@mui/material/useMediaQuery";

const StudentEnrolled = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext);
  const { getToken: getClerkToken, userId } = useAuth();
  const [enrolledStudents, setEnrolledStudents] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Quiz Reports states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportOptions, setReportOptions] = useState({
    includeStudentDetails: true,
    includeQuestionAnalysis: true,
    includeGradeDistribution: true,
    includeTimeAnalysis: false,
    includePerformanceTrends: true,
    showPassFailOnly: false,
  });
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  const isMobile = useMediaQuery("(max-width:600px)");

  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication failed. Please login again.");
        return;
      }

      const { data } = await axios.get(
        `${backendUrl}/api/educator/enrolled-students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setEnrolledStudents(
          data.enrolledStudents.length > 0
            ? data.enrolledStudents.reverse()
            : []
        );
      } else {
        toast.error(data.message || "Failed to fetch enrolled students");
      }
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch enrolled students"
      );
    }
  };

  // Quiz Reports functions
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = await getClerkToken();

      const response = await axios.get(
        `${backendUrl}/api/quiz/instructor/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setQuizzes(response.data.quizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedQuiz) {
      setError("Please select a quiz first");
      return;
    }

    try {
      setLoading(true);
      const token = await getClerkToken();

      const response = await axios.post(
        `${backendUrl}/api/quiz/report`,
        {
          quizId: selectedQuiz,
          options: reportOptions,
          dateRange,
          scoreRange: {
            min: minScore ? parseFloat(minScore) : null,
            max: maxScore ? parseFloat(maxScore) : null,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setReportData(response.data.report);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!selectedQuiz) {
      toast.error("Please select a quiz first");
      return;
    }

    try {
      setLoading(true);
      const token = await getClerkToken();

      const response = await axios.post(
        `${backendUrl}/api/quiz/report/excel`,
        {
          quizId: selectedQuiz,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          minScore: minScore,
          maxScore: maxScore,
          includeStudentDetails: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `quiz-report-${selectedQuiz}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents();
    }
  }, [isEducator]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchQuizzes();
    }
  }, [activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderEnrolledStudents = () =>
    isMobile ? (
      <Box p={2}>
        {enrolledStudents.length > 0 ? (
          <Grid container spacing={2}>
            {enrolledStudents.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
                  <Box sx={{ mr: 2 }}>
                    <img
                      src={item.student.imageUrl}
                      alt="profile"
                      style={{ width: 48, height: 48, borderRadius: "50%" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {item.student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.courseTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip label={`#${index + 1}`} size="small" />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography align="center" color="text.secondary">
            No enrolled students found.
          </Typography>
        )}
      </Box>
    ) : (
      <div className="h-screen flex flex-col items-start justify-between md:p-8 p-4 pt-8">
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-300 shadow-md">
          <table className="w-full table-auto">
            {/* Table Header */}
            <thead className="text-gray-900 bg-gray-100 text-sm border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">#</th>
                <th className="px-4 py-3 font-semibold text-left">
                  Student Name
                </th>
                <th className="px-4 py-3 font-semibold text-left">
                  Course Title
                </th>
                <th className="px-4 py-3 font-semibold text-right">Date</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-sm text-gray-700">
              {enrolledStudents.length > 0 ? (
                enrolledStudents.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 even:bg-gray-50"
                  >
                    {/* Index Number */}
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">
                      {index + 1}
                    </td>

                    {/* Student Info */}
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={item.student.imageUrl}
                        alt="profile"
                        className="w-10 h-10 rounded-full shadow-md"
                      />
                      <span className="truncate font-medium text-gray-800">
                        {item.student.name}
                      </span>
                    </td>

                    {/* Course Title */}
                    <td className="px-4 py-3 truncate text-gray-600">
                      {item.courseTitle}
                    </td>

                    {/* Purchase Date */}
                    <td className="px-4 py-3 text-right text-gray-600">
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-3 text-center text-gray-500"
                  >
                    No enrolled students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );

  const renderQuizReports = () => (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Quiz Reports Generator
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchQuizzes}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Report Configuration */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Configuration
          </Typography>

          <Grid container spacing={3}>
            {/* Quiz Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Quiz</InputLabel>
                <Select
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  label="Select Quiz"
                >
                  {quizzes.map((quiz) => (
                    <MenuItem key={quiz._id} value={quiz._id}>
                      {quiz.title} - {quiz.course?.courseTitle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Score Range */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Score (%)"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Score (%)"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            {/* Report Options */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Report Options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.includeStudentDetails}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                includeStudentDetails: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Include Student Details"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.includeQuestionAnalysis}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                includeQuestionAnalysis: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Include Question Analysis"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.includeGradeDistribution}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                includeGradeDistribution: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Include Grade Distribution"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.includeTimeAnalysis}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                includeTimeAnalysis: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Include Time Analysis"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.includePerformanceTrends}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                includePerformanceTrends: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Include Performance Trends"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportOptions.showPassFailOnly}
                            onChange={(e) =>
                              setReportOptions({
                                ...reportOptions,
                                showPassFailOnly: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Show Pass/Fail Only"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Generate Report Button */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading || !selectedQuiz}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : "Generate Report"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h5" gutterBottom>
                Quiz Report:{" "}
                {quizzes.find((q) => q._id === selectedQuiz)?.title}
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Print Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportExcel}
                >
                  Export Excel
                </Button>
              </Box>
            </Box>

            {/* Report Summary */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Submissions
                    </Typography>
                    <Typography variant="h4">
                      {reportData.summary.totalSubmissions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Passed Students
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {reportData.summary.passedStudents}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Average Score
                    </Typography>
                    <Typography variant="h4">
                      {reportData.summary.averageScore.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pass Rate
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {reportData.summary.passRate.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Student Performance Table */}
            {reportOptions.includeStudentDetails && reportData.students && (
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Student Performance
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Grade</TableCell>
                        <TableCell align="center">Submitted</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell align="right">
                            {student.score}/{student.totalMarks}
                          </TableCell>
                          <TableCell align="right">
                            {student.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={student.status}
                              color={
                                student.status === "ناجح" ? "success" : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={student.grade}
                              color={
                                student.grade === "ممتاز"
                                  ? "success"
                                  : student.grade === "جيد جداً"
                                  ? "primary"
                                  : student.grade === "جيد"
                                  ? "warning"
                                  : student.grade === "مقبول"
                                  ? "info"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {new Date(student.submittedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Grade Distribution */}
            {reportOptions.includeGradeDistribution &&
              reportData.gradeDistribution && (
                <Box mb={4}>
                  <Typography variant="h6" gutterBottom>
                    Grade Distribution
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(reportData.gradeDistribution).map(
                      ([grade, count]) => (
                        <Grid item xs={12} sm={6} md={2} key={grade}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" align="center">
                                {count}
                              </Typography>
                              <Typography
                                variant="body2"
                                align="center"
                                color="textSecondary"
                              >
                                {grade}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>
              )}

            {/* Question Analysis */}
            {reportOptions.includeQuestionAnalysis &&
              reportData.questionAnalysis && (
                <Box mb={4}>
                  <Typography variant="h6" gutterBottom>
                    Question Analysis
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Question</TableCell>
                          <TableCell align="center">Correct Answers</TableCell>
                          <TableCell align="center">
                            Incorrect Answers
                          </TableCell>
                          <TableCell align="center">Success Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.questionAnalysis.map((question, index) => (
                          <TableRow key={index}>
                            <TableCell>{question.questionText}</TableCell>
                            <TableCell align="center">
                              {question.correctAnswers}
                            </TableCell>
                            <TableCell align="center">
                              {question.incorrectAnswers}
                            </TableCell>
                            <TableCell align="center">
                              {question.successRate.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

            {/* Comprehensive Quiz Analysis */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                تحليل شامل للاختبار
              </Typography>
              <Grid container spacing={3}>
                {/* Quiz Performance Overview */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        نظرة عامة على الأداء
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>اسم الاختبار:</strong> {reportData.quiz.title}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>المقرر:</strong> {reportData.quiz.courseTitle}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>عدد الأسئلة:</strong>{" "}
                        {reportData.quiz.questions}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>الدرجة الكلية:</strong>{" "}
                        {reportData.quiz.totalMarks}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>عدد المشاركين:</strong>{" "}
                        {reportData.summary.totalSubmissions}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>متوسط الدرجات:</strong>{" "}
                        {reportData.summary.averageScore.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>نسبة النجاح:</strong>{" "}
                        {reportData.summary.passRate.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Performance Insights */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="secondary">
                        رؤى الأداء
                      </Typography>
                      {reportData.summary.passRate >= 80 ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          paragraph
                        >
                          ✅ <strong>ممتاز!</strong> نسبة النجاح عالية جداً
                        </Typography>
                      ) : reportData.summary.passRate >= 60 ? (
                        <Typography
                          variant="body2"
                          color="warning.main"
                          paragraph
                        >
                          ⚠️ <strong>جيد</strong> نسبة النجاح مقبولة
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error.main"
                          paragraph
                        >
                          ❌ <strong>تحتاج تحسين</strong> نسبة النجاح منخفضة
                        </Typography>
                      )}

                      {reportData.summary.averageScore >= 85 ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          paragraph
                        >
                          📈 <strong>أداء عالي</strong> متوسط الدرجات ممتاز
                        </Typography>
                      ) : reportData.summary.averageScore >= 70 ? (
                        <Typography
                          variant="body2"
                          color="warning.main"
                          paragraph
                        >
                          📊 <strong>أداء متوسط</strong> متوسط الدرجات مقبول
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error.main"
                          paragraph
                        >
                          📉 <strong>أداء منخفض</strong> متوسط الدرجات يحتاج
                          تحسين
                        </Typography>
                      )}

                      {reportData.summary.totalSubmissions < 5 ? (
                        <Typography variant="body2" color="info.main" paragraph>
                          ℹ️ <strong>عينة صغيرة</strong> عدد المشاركين قليل
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="success.main"
                          paragraph
                        >
                          ✅ <strong>عينة كافية</strong> عدد المشاركين مناسب
                          للتحليل
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Question Difficulty Analysis */}
                {reportOptions.includeQuestionAnalysis &&
                  reportData.questionAnalysis && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="info">
                            تحليل صعوبة الأسئلة
                          </Typography>
                          <Grid container spacing={2}>
                            {reportData.questionAnalysis.map(
                              (question, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Card variant="outlined" sx={{ p: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                    >
                                      السؤال {index + 1}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      paragraph
                                      sx={{ fontSize: "0.8rem" }}
                                    >
                                      {question.questionText.length > 50
                                        ? question.questionText.substring(
                                            0,
                                            50
                                          ) + "..."
                                        : question.questionText}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      نسبة النجاح:{" "}
                                      {question.successRate.toFixed(1)}%
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      الإجابات الصحيحة:{" "}
                                      {question.correctAnswers}/
                                      {question.totalAnswers}
                                    </Typography>
                                    {question.successRate >= 80 ? (
                                      <Chip
                                        label="سهل"
                                        color="success"
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    ) : question.successRate >= 40 ? (
                                      <Chip
                                        label="متوسط"
                                        color="warning"
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      <Chip
                                        label="صعب"
                                        color="error"
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Card>
                                </Grid>
                              )
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                {/* Recommendations */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        التوصيات
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {reportData.summary.passRate < 60 && (
                          <Typography component="li" variant="body2" paragraph>
                            🔍 <strong>مراجعة محتوى الاختبار:</strong> نسبة
                            النجاح منخفضة، قد تحتاج لمراجعة صعوبة الأسئلة
                          </Typography>
                        )}
                        {reportData.summary.averageScore < 70 && (
                          <Typography component="li" variant="body2" paragraph>
                            📚 <strong>تحسين التدريس:</strong> متوسط الدرجات
                            منخفض، قد تحتاج لتحسين طريقة الشرح
                          </Typography>
                        )}
                        {reportOptions.includeQuestionAnalysis &&
                          reportData.questionAnalysis &&
                          reportData.questionAnalysis.some(
                            (q) => q.successRate < 30
                          ) && (
                            <Typography
                              component="li"
                              variant="body2"
                              paragraph
                            >
                              ❓ <strong>مراجعة الأسئلة الصعبة:</strong> بعض
                              الأسئلة صعبة جداً، قد تحتاج لإعادة صياغة
                            </Typography>
                          )}
                        {reportData.summary.totalSubmissions < 3 && (
                          <Typography component="li" variant="body2" paragraph>
                            👥 <strong>تشجيع المشاركة:</strong> عدد المشاركين
                            قليل، قد تحتاج لتشجيع الطلاب على المشاركة
                          </Typography>
                        )}
                        {reportData.summary.passRate >= 80 &&
                          reportData.summary.averageScore >= 85 && (
                            <Typography
                              component="li"
                              variant="body2"
                              paragraph
                            >
                              🎉 <strong>أداء ممتاز:</strong> الاختبار يعمل بشكل
                              جيد، يمكن إضافة أسئلة أكثر تحدياً
                            </Typography>
                          )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );

  return enrolledStudents ? (
    <div className="min-h-screen bg-white">
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Student management tabs"
        >
          <Tab
            icon={<PeopleIcon />}
            label="Enrolled Students"
            iconPosition="start"
          />
          <Tab
            icon={<DescriptionIcon />}
            label="Quiz Reports"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && renderEnrolledStudents()}
      {activeTab === 1 && renderQuizReports()}
    </div>
  ) : (
    <Loading />
  );
};

export default StudentEnrolled;
