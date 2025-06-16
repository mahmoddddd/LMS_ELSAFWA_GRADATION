import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  Container,
  Paper,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Radio,
  Divider,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { AppContext } from "../../context/AppContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ar } from "date-fns/locale";

const AddQuiz = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: new Date(),
    totalMarks: 100,
    questions: [
      {
        questionText: "",
        questionType: "multiple_choice",
        marks: 10,
        correctAnswer: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ],
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${backendUrl}/api/educator/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Courses data:", response.data);
        setCourses(response.data.courses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError("فشل في تحميل قائمة الكورسات");
      }
    };

    const fetchQuiz = async () => {
      if (!quizId) return;

      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(`${backendUrl}/api/quiz/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const quizData = response.data.quiz;
        setQuiz({
          title: quizData.title,
          description: quizData.description,
          courseId: quizData.course._id,
          dueDate: new Date(quizData.dueDate),
          totalMarks: quizData.totalMarks,
          questions: quizData.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
            correctAnswer: q.correctAnswer,
            options: q.options || [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
          })),
        });
      } catch (error) {
        setError("فشل في تحميل بيانات الكويز");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    console.log("Current courses state:", courses);
    console.log(
      "Course titles in state:",
      courses.map((course) => course.title || course.courseTitle)
    );
  }, [courses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication failed. Please login again.");
        return;
      }

      const url = quizId
        ? `${backendUrl}/api/quiz/${quizId}`
        : `${backendUrl}/api/quiz`;

      const method = quizId ? "put" : "post";

      const response = await axios[method](
        url,
        {
          title: quiz.title,
          description: quiz.description,
          courseId: quiz.courseId,
          dueDate: quiz.dueDate,
          totalMarks: quiz.totalMarks,
          questions: quiz.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
            correctAnswer: q.correctAnswer,
            options: q.options,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        navigate("/educator/quizzes");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError(error.response?.data?.message || "حدث خطأ أثناء حفظ الكويز");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[questionIndex].options[optionIndex].text = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const newQuestions = [...quiz.questions];
    // Reset all options to false
    newQuestions[questionIndex].options.forEach(
      (opt) => (opt.isCorrect = false)
    );
    // Set the selected option to true
    newQuestions[questionIndex].options[optionIndex].isCorrect = true;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleAddQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          questionText: "",
          questionType: "multiple_choice",
          marks: 10,
          correctAnswer: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ],
    });
  };

  const handleQuestionTypeChange = (index, type) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      questionType: type,
      options:
        type === "text"
          ? []
          : [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
      correctAnswer: type === "text" ? "" : undefined,
    };
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQuestions });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {quizId ? "تعديل الكويز" : "إضافة كويز جديد"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="عنوان الكويز"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="وصف الكويز"
                value={quiz.description}
                onChange={(e) =>
                  setQuiz({ ...quiz, description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>المقرر</InputLabel>
                <Select
                  value={quiz.courseId}
                  onChange={(e) =>
                    setQuiz({ ...quiz, courseId: e.target.value })
                  }
                  label="المقرر"
                >
                  {courses && courses.length > 0 ? (
                    courses.map((course) => (
                      <MenuItem key={course._id} value={course._id}>
                        {course.courseTitle}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>لا توجد مقررات متاحة</MenuItem>
                  )}
                </Select>
              </FormControl>
              {courses && courses.length === 0 && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  لا توجد مقررات منشورة متاحة. يرجى نشر مقرر أولاً.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="الدرجة الكلية"
                value={quiz.totalMarks}
                onChange={(e) =>
                  setQuiz({ ...quiz, totalMarks: Number(e.target.value) })
                }
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={ar}
              >
                <DateTimePicker
                  label="تاريخ الاستحقاق"
                  value={quiz.dueDate}
                  onChange={(newValue) =>
                    setQuiz({ ...quiz, dueDate: newValue })
                  }
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Typography variant="subtitle1">نوع الكويز:</Typography>
                <Chip label="كويز عادي" color="primary" />
                <Chip label="كويز ملف (قريباً)" color="default" disabled />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                الأسئلة
              </Typography>
              {quiz.questions.map((question, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={`السؤال ${index + 1}`}
                          value={question.questionText}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "questionText",
                              e.target.value
                            )
                          }
                          required
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>نوع السؤال</InputLabel>
                          <Select
                            value={question.questionType}
                            onChange={(e) =>
                              handleQuestionTypeChange(index, e.target.value)
                            }
                            label="نوع السؤال"
                          >
                            <MenuItem value="multiple_choice">
                              اختيار من متعدد
                            </MenuItem>
                            <MenuItem value="text">إجابة نصية</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="الدرجة"
                          value={question.marks}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "marks",
                              Number(e.target.value)
                            )
                          }
                          required
                        />
                      </Grid>

                      {question.questionType === "multiple_choice" && (
                        <>
                          {question.options.map((option, optionIndex) => (
                            <Grid item xs={12} key={optionIndex}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Radio
                                  checked={option.isCorrect}
                                  onChange={() =>
                                    handleCorrectAnswerChange(
                                      index,
                                      optionIndex
                                    )
                                  }
                                />
                                <TextField
                                  fullWidth
                                  label={`الخيار ${optionIndex + 1}`}
                                  value={option.text}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      index,
                                      optionIndex,
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </Box>
                            </Grid>
                          ))}
                        </>
                      )}
                    </Grid>
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={quiz.questions.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                إضافة سؤال
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/educator/quizzes")}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {quizId ? "تحديث الكويز" : "إنشاء الكويز"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddQuiz;
