import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { AppContext } from "../../context/AppContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ar } from "date-fns/locale";

const AddQuiz = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const navigate = useNavigate();
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

        if (response.data.success) {
          setCourses(response.data.courses);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("حدث خطأ في جلب الكورسات");
      }
    };

    fetchCourses();
  }, [backendUrl, getToken]);

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
    setError("");

    try {
      const token = await getToken();

      // إنشاء الاختبار
      const quizResponse = await axios.post(
        `${backendUrl}/api/quiz`,
        {
          title: quiz.title,
          description: quiz.description,
          courseId: quiz.courseId,
          dueDate: quiz.dueDate,
          totalMarks: parseInt(quiz.totalMarks),
          questions: quiz.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            marks: parseInt(q.marks),
            options: q.questionType === "text" ? [] : q.options,
            correctAnswer:
              q.questionType === "text" ? q.correctAnswer : undefined,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (quizResponse.data.success) {
        navigate(`/course/${quiz.courseId}/quizzes`);
      } else {
        setError(quizResponse.data.message || "فشل في إنشاء الاختبار");
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError(err.response?.data?.message || "حدث خطأ في إنشاء الاختبار");
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          إضافة اختبار جديد
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
                label="عنوان الاختبار"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف الاختبار"
                value={quiz.description}
                onChange={(e) =>
                  setQuiz({ ...quiz, description: e.target.value })
                }
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel
                  id="course-select-label"
                  sx={{ color: "text.primary" }}
                >
                  المقرر
                </InputLabel>
                <Select
                  labelId="course-select-label"
                  name="courseId"
                  value={quiz.courseId}
                  onChange={(e) =>
                    setQuiz({ ...quiz, courseId: e.target.value })
                  }
                  label="المقرر"
                  id="course-select"
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: "background.paper",
                        "& .MuiMenuItem-root": {
                          color: "text.primary",
                        },
                      },
                    },
                  }}
                  sx={{
                    color: "text.primary",
                    bgcolor: "background.paper",
                    "& .MuiSelect-select": {
                      color: "text.primary",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "divider",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <MenuItem value="" disabled sx={{ color: "text.primary" }}>
                    اختر المقرر
                  </MenuItem>
                  {courses && courses.length > 0 ? (
                    courses.map((course) => {
                      console.log("Rendering course:", course);
                      return (
                        <MenuItem
                          key={course._id}
                          value={course._id}
                          sx={{
                            color: "text.primary",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          {course.courseTitle}
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled sx={{ color: "text.primary" }}>
                      لا توجد مقررات منشورة متاحة
                    </MenuItem>
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
                  label="تاريخ ووقت انتهاء الاختبار"
                  value={quiz.dueDate}
                  onChange={(newValue) =>
                    setQuiz({ ...quiz, dueDate: newValue })
                  }
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الدرجة الكلية"
                type="number"
                value={quiz.totalMarks}
                onChange={(e) =>
                  setQuiz({ ...quiz, totalMarks: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddQuestion}
                sx={{ mb: 2 }}
              >
                إضافة سؤال
              </Button>
            </Grid>
            {quiz.questions.map((question, index) => (
              <Grid item xs={12} key={index}>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      {question.questionType === "text" ? (
                        <>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="نص السؤال"
                            value={question.questionText}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "questionText",
                                e.target.value
                              )
                            }
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="الإجابة الصحيحة"
                            value={question.correctAnswer || ""}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "correctAnswer",
                                e.target.value
                              )
                            }
                            sx={{ mb: 2 }}
                          />
                        </>
                      ) : (
                        <>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="نص السؤال"
                            value={question.questionText}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "questionText",
                                e.target.value
                              )
                            }
                            sx={{ mb: 2 }}
                          />
                          {question.options.map((option, optionIndex) => (
                            <Box key={optionIndex} sx={{ mb: 2 }}>
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
                              />
                              <FormControlLabel
                                control={
                                  <Radio
                                    checked={option.isCorrect}
                                    onChange={() =>
                                      handleCorrectAnswerChange(
                                        index,
                                        optionIndex
                                      )
                                    }
                                  />
                                }
                                label="إجابة صحيحة"
                              />
                            </Box>
                          ))}
                        </>
                      )}
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
                        label="درجة السؤال"
                        type="number"
                        value={question.marks}
                        onChange={(e) =>
                          handleQuestionChange(index, "marks", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleRemoveQuestion(index)}
                        startIcon={<DeleteIcon />}
                      >
                        حذف السؤال
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "حفظ الاختبار"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddQuiz;
