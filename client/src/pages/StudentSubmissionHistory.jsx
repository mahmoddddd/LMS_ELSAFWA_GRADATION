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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import NavigationButtons from "../components/NavigationButtons";

const StudentSubmissionHistory = () => {
  const { quizId } = useParams();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/quiz/${quizId}/submission-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubmissions(response.data.submissions);
        setQuizTitle(response.data.quizTitle);
        setTotalMarks(response.data.totalMarks);
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في جلب سجل التقديمات");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [quizId, getToken]);

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
  };

  const getGradeColor = (gradeText) => {
    switch (gradeText) {
      case "ممتاز":
        return "success";
      case "جيد جداً":
        return "info";
      case "جيد":
        return "primary";
      case "مقبول":
        return "warning";
      case "راسب":
        return "error";
      default:
        return "default";
    }
  };

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
        {quizTitle} - سجل التقديمات
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>التاريخ</TableCell>
              <TableCell>الدرجة</TableCell>
              <TableCell>النسبة المئوية</TableCell>
              <TableCell>التقدير</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>
                  {format(new Date(submission.submittedAt), "PPP", {
                    locale: ar,
                  })}
                </TableCell>
                <TableCell>
                  {submission.score} من {submission.totalMarks}
                </TableCell>
                <TableCell>{submission.percentage}%</TableCell>
                <TableCell>
                  <Chip
                    label={submission.gradeText}
                    color={getGradeColor(submission.gradeText)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={submission.status}
                    color={submission.status === "ناجح" ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewSubmission(submission)}
                  >
                    عرض التفاصيل
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSubmission && (
          <>
            <DialogTitle>
              تفاصيل التقديم -{" "}
              {format(new Date(selectedSubmission.submittedAt), "PPP", {
                locale: ar,
              })}
            </DialogTitle>
            <DialogContent>
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  ملخص التقديم
                </Typography>
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      الدرجة: {selectedSubmission.score} من{" "}
                      {selectedSubmission.totalMarks}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      النسبة المئوية: {selectedSubmission.percentage}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      التقدير: {selectedSubmission.gradeText}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      الحالة: {selectedSubmission.status}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>
                  الإجابات
                </Typography>
                {selectedSubmission.answers.map((answer, index) => (
                  <Box
                    key={index}
                    mb={2}
                    p={2}
                    border="1px solid #eee"
                    borderRadius={1}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      السؤال {index + 1}: {answer.questionText}
                    </Typography>
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        الإجابة:{" "}
                        {answer.answer.textAnswer ||
                          answer.answer.selectedOption}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="textSecondary">
                        الدرجة: {answer.score} من {answer.maxScore}
                      </Typography>
                      <Chip
                        label={answer.isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                        color={answer.isCorrect ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                    {answer.feedback && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mt: 1 }}
                      >
                        ملاحظات المدرس: {answer.feedback}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StudentSubmissionHistory;
