import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
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
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { backendUrl } from "../../config";
import NavigationButtons from "../../components/NavigationButtons";

const QuizManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (user?.id) {
      console.log("User ID from Clerk:", user.id); // Debug log
      fetchQuizzes();
    } else {
      console.log("No user ID available"); // Debug log
      setLoading(false);
      setError("لم يتم العثور على معرف المستخدم");
    }
  }, [user?.id]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching quizzes for user:", user.id); // Debug log

      const token = await getToken();
      console.log("Token received:", token ? "Yes" : "No"); // Debug log

      const response = await axios.get(
        `${backendUrl}/quiz/instructor/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response received:", response.data); // Debug log

      if (response.data.success && response.data.quizzes) {
        setQuizzes(response.data.quizzes);
      } else {
        console.log("No quizzes in response:", response.data);
        setQuizzes([]);
      }
    } catch (err) {
      console.error("Error details:", err.response || err); // Debug log
      setError(
        err.response?.data?.message ||
          err.message ||
          "حدث خطأ في جلب الاختبارات"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/quiz/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
    if (!quizId) {
      setError("معرف الاختبار غير صالح");
      return;
    }
    navigate(`/educator/quizzes/${quizId}/submissions`);
  };

  const handleViewAnalytics = (quizId) => {
    if (!quizId) {
      setError("معرف الاختبار غير صالح");
      return;
    }
    navigate(`/educator/quizzes/${quizId}/analytics`);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" color="textSecondary">
          جاري تحميل الاختبارات...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Typography color="textSecondary" paragraph>
          يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchQuizzes}
          sx={{ mt: 2 }}
        >
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <NavigationButtons />
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

      {quizzes.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            لا توجد اختبارات حتى الآن
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/educator/add-quiz")}
            sx={{ mt: 2 }}
          >
            إضافة اختبار جديد
          </Button>
        </Box>
      ) : (
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
                      onClick={() =>
                        navigate(`/educator/edit-quiz/${quiz._id}`)
                      }
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
      )}

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
