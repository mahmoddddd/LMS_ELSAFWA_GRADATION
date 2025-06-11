import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

const QuizSubmissions = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [quizId]);

  const fetchSubmissions = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:4000/api/quiz/${quizId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSubmissions(response.data.submissions);
    } catch (err) {
      setError("حدث خطأ في جلب التقديمات");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `http://localhost:4000/api/quiz/${quizId}/submissions/${selectedSubmission._id}/grade`,
        {
          grade,
          feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setGradeDialogOpen(false);
      fetchSubmissions();
    } catch (err) {
      setError("حدث خطأ في تقدير التقديم");
      console.error(err);
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

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        تقديمات الاختبار
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>اسم الطالب</TableCell>
              <TableCell>تاريخ التقديم</TableCell>
              <TableCell>الدرجة</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>{submission.studentName}</TableCell>
                <TableCell>
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{submission.grade || "لم يتم التقدير"}</TableCell>
                <TableCell>
                  {submission.status === "graded"
                    ? "تم التقدير"
                    : "في انتظار التقدير"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setGrade(submission.grade || 0);
                      setFeedback(submission.feedback || "");
                      setGradeDialogOpen(true);
                    }}
                  >
                    تقدير
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>تقدير التقديم</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              إجابات الطالب:
            </Typography>
            {selectedSubmission?.answers.map((answer, index) => (
              <Box key={index} mb={2}>
                <Typography variant="body1" fontWeight="bold">
                  السؤال {index + 1}:
                </Typography>
                <Typography variant="body2">{answer.text}</Typography>
                {answer.fileUrl && (
                  <Button
                    href={answer.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    عرض الملف المرفق
                  </Button>
                )}
              </Box>
            ))}
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                الدرجة:
              </Typography>
              <Rating
                value={grade}
                onChange={(event, newValue) => setGrade(newValue)}
                max={10}
              />
            </Box>
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                الملاحظات:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleGradeSubmission}
            variant="contained"
            color="primary"
          >
            حفظ التقدير
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizSubmissions;
