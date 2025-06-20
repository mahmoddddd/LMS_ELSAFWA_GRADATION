import React, { useState, useEffect, useContext, useRef } from "react";
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { AppContext } from "../../context/AppContext";

const QuizReports = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken, userId } = useAuth();
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
  const printRef = useRef();

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = await getToken();

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
      const token = await getToken();

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
    if (printRef.current) {
      window.print();
    }
  };

  const exportToPDF = async () => {
    try {
      const token = await getToken();

      const response = await axios.post(
        `${backendUrl}/api/quiz/report/pdf`,
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
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-report-${selectedQuiz}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setError("Failed to export PDF");
    }
  };

  const exportToExcel = async () => {
    try {
      const token = await getToken();

      const response = await axios.post(
        `${backendUrl}/api/quiz/report/excel`,
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
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-report-${selectedQuiz}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      setError("Failed to export Excel");
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const selectedQuizData = quizzes.find((q) => q._id === selectedQuiz);

  return (
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
        <div ref={printRef}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h5" gutterBottom>
                  Quiz Report: {selectedQuizData?.title}
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
                    onClick={exportToPDF}
                  >
                    Export PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportToExcel}
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
                                  student.status === "ناجح"
                                    ? "success"
                                    : "error"
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
                              {new Date(
                                student.submittedAt
                              ).toLocaleDateString()}
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
                            <TableCell align="center">
                              Correct Answers
                            </TableCell>
                            <TableCell align="center">
                              Incorrect Answers
                            </TableCell>
                            <TableCell align="center">Success Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.questionAnalysis.map(
                            (question, index) => (
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
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default QuizReports;
