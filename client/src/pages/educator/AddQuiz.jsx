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
  useMediaQuery,
  useTheme,
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
    isFileQuiz: false,
    quizFile: null,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
          isFileQuiz: quizData.isFileQuiz,
          quizFile: quizData.quizFile,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const url = quizId
        ? `${backendUrl}/api/quiz/${quizId}`
        : `${backendUrl}/api/quiz`;

      const method = quizId ? "put" : "post";

      if (quiz.isFileQuiz && quiz.quizFile) {
        const formData = new FormData();
        formData.append("title", quiz.title);
        formData.append("description", quiz.description);
        formData.append("courseId", quiz.courseId);
        formData.append("dueDate", quiz.dueDate);
        formData.append("totalMarks", quiz.totalMarks);
        formData.append("isFileQuiz", true);
        formData.append("quizFile", quiz.quizFile);

        const response = await axios[method](url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          navigate("/educator/quizzes");
        }
      } else {
        const response = await axios[method](
          url,
          {
            title: quiz.title,
            description: quiz.description,
            courseId: quiz.courseId,
            dueDate: quiz.dueDate,
            totalMarks: quiz.totalMarks,
            isFileQuiz: false,
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
            },
          }
        );

        if (response.data.success) {
          navigate("/educator/quizzes");
        }
      }
    } catch (error) {
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
    newQuestions[questionIndex].options.forEach(
      (opt) => (opt.isCorrect = false)
    );
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuiz((prev) => ({
        ...prev,
        quizFile: file,
        isFileQuiz: true,
      }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: isMobile ? 2 : 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          {quizId ? "تعديل الكويز" : "إضافة كويز جديد"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 1 : 3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="عنوان الكويز"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                label="وصف الكويز"
                value={quiz.description}
                onChange={(e) =>
                  setQuiz({ ...quiz, description: e.target.value })
                }
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                required
                size={isMobile ? "small" : "medium"}
              >
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
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={ar}
              >
                <DateTimePicker
                  label="تاريخ التسليم"
                  value={quiz.dueDate}
                  onChange={(newValue) =>
                    setQuiz({ ...quiz, dueDate: newValue })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quiz.isFileQuiz}
                    onChange={(e) =>
                      setQuiz({ ...quiz, isFileQuiz: e.target.checked })
                    }
                    size={isMobile ? "small" : "medium"}
                  />
                }
                label="رفع الكويز كملف"
              />
            </Grid>

            {quiz.isFileQuiz ? (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                >
                  رفع ملف الكويز
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </Button>
                {quiz.quizFile && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      border: "1px solid #ddd",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      معلومات الملف:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      اسم الملف: {quiz.quizFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      نوع الملف: {quiz.quizFile.type || "غير معروف"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      حجم الملف:{" "}
                      {(quiz.quizFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                    {quiz.quizFile.fileUrl && (
                      <Button
                        variant="text"
                        color="primary"
                        href={quiz.quizFile.fileUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                        size={isMobile ? "small" : "medium"}
                      >
                        عرض الملف
                      </Button>
                    )}
                  </Box>
                )}
              </Grid>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="الدرجة الكلية"
                    value={quiz.totalMarks}
                    onChange={(e) =>
                      setQuiz({ ...quiz, totalMarks: e.target.value })
                    }
                    required
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                    الأسئلة
                  </Typography>
                  {quiz.questions.map((question, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={isMobile ? 1 : 2}>
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
                              size={isMobile ? "small" : "medium"}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl
                              fullWidth
                              size={isMobile ? "small" : "medium"}
                            >
                              <InputLabel>نوع السؤال</InputLabel>
                              <Select
                                value={question.questionType}
                                onChange={(e) =>
                                  handleQuestionTypeChange(
                                    index,
                                    e.target.value
                                  )
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
                                  e.target.value
                                )
                              }
                              required
                              size={isMobile ? "small" : "medium"}
                            />
                          </Grid>

                          {question.questionType === "multiple_choice" && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle1" gutterBottom>
                                الخيارات
                              </Typography>
                              {question.options.map((option, optionIndex) => (
                                <Box
                                  key={optionIndex}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1,
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
                                    size={isMobile ? "small" : "medium"}
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
                                    size={isMobile ? "small" : "medium"}
                                  />
                                </Box>
                              ))}
                            </Grid>
                          )}

                          {question.questionType === "text" && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="الإجابة الصحيحة"
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "correctAnswer",
                                    e.target.value
                                  )
                                }
                                required
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                          )}

                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleRemoveQuestion(index)}
                              size={isMobile ? "small" : "medium"}
                            >
                              حذف السؤال
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddQuestion}
                    sx={{ mt: 2 }}
                    size={isMobile ? "small" : "medium"}
                  >
                    إضافة سؤال
                  </Button>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                size={isMobile ? "medium" : "large"}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : quizId ? (
                  "تحديث الكويز"
                ) : (
                  "إنشاء الكويز"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddQuiz;
