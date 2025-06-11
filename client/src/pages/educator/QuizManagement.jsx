import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssessmentIcon from "@mui/icons-material/Assessment";

const QuizManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:4000/api/quiz/course/:courseId",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQuizzes(response.data.quizzes);
    } catch (err) {
      setError("حدث خطأ في جلب الاختبارات");
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      const token = await getToken();
      await axios.delete(`http://localhost:4000/api/quiz/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(quizzes.filter((quiz) => quiz._id !== quizId));
      setDeleteDialogOpen(false);
    } catch (err) {
      setError("حدث خطأ في حذف الاختبار");
      console.error(err);
    }
  };

  const handleViewSubmissions = (quizId) => {
    navigate(`/educator/quiz/${quizId}/submissions`);
  };

  const handleViewAnalytics = (quizId) => {
    navigate(`/educator/quiz/${quizId}/analytics`);
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          إدارة الاختبارات
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/educator/add-quiz")}
        >
          إضافة اختبار جديد
        </Button>
      </Box>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>عنوان الاختبار</TableCell>
              <TableCell>الوصف</TableCell>
              <TableCell>تاريخ الاستحقاق</TableCell>
              <TableCell>الدرجة الكلية</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz._id}>
                <TableCell>{quiz.title}</TableCell>
                <TableCell>{quiz.description}</TableCell>
                <TableCell>
                  {new Date(quiz.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{quiz.totalMarks}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => navigate(`/educator/edit-quiz/${quiz._id}`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleViewSubmissions(quiz._id)}
                    color="info"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleViewAnalytics(quiz._id)}
                    color="success"
                  >
                    <AssessmentIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>هل أنت متأكد من حذف هذا الاختبار؟</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={() => handleDeleteQuiz(selectedQuiz._id)}
            color="error"
            variant="contained"
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizManagement;
