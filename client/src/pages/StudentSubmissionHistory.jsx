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
} from "@mui/material";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const StudentSubmissionHistory = () => {
  const { quizId } = useParams();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/quiz/${quizId}/submission-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubmissions(response.data.submissions);
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
        سجل التقديمات
      </Typography>

      <Grid container spacing={3}>
        {submissions.map((submission) => (
          <Grid item xs={12} key={submission._id}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">
                    تقديم بتاريخ{" "}
                    {format(new Date(submission.submittedAt), "PPP", {
                      locale: ar,
                    })}
                  </Typography>
                  <Chip
                    label={`الدرجة: ${submission.score}%`}
                    color={submission.score >= 60 ? "success" : "error"}
                  />
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="textSecondary">
                    عدد الأسئلة: {submission.answers.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleViewSubmission(submission)}
                  >
                    عرض التفاصيل
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
                  الإجابات
                </Typography>
                {selectedSubmission.answers.map((answer, index) => (
                  <Box key={index} mb={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      السؤال {index + 1}
                    </Typography>
                    {answer.fileUrl ? (
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          تم رفع ملف: {answer.fileName}
                        </Typography>
                        <Button
                          href={answer.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          عرض الملف
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body1">{answer.answer}</Typography>
                    )}
                    {answer.feedback && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mt: 1 }}
                      >
                        ملاحظات المدرس: {answer.feedback}
                      </Typography>
                    )}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mt={1}
                    >
                      <Typography variant="body2" color="textSecondary">
                        الدرجة: {answer.score}
                      </Typography>
                      <Chip
                        label={answer.isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                        color={answer.isCorrect ? "success" : "error"}
                        size="small"
                      />
                    </Box>
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
