import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const CreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    totalScore: 100,
    questions: [
      {
        text: "",
        type: "multiple_choice",
        score: 10,
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          text: "",
          type: "multiple_choice",
          score: 10,
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.post(
        `http://localhost:4000/api/quiz/course/${courseId}`,
        {
          ...quizData,
          educatorId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-ID": userId,
          },
        }
      );

      if (response.data.success) {
        navigate(`/courses/${courseId}/quizzes`);
      } else {
        setError(response.data.message || "حدث خطأ في إنشاء الاختبار");
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError(err.response?.data?.message || "حدث خطأ في إنشاء الاختبار");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      p={isMobile ? 2 : 3}
      sx={{
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <Typography
        variant={isMobile ? "h5" : "h4"}
        component="h1"
        gutterBottom
        sx={{ textAlign: isMobile ? "center" : "left" }}
      >
        إنشاء اختبار جديد
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="عنوان الاختبار"
              value={quizData.title}
              onChange={(e) =>
                setQuizData({ ...quizData, title: e.target.value })
              }
              required
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={isMobile ? 2 : 3}
              label="وصف الاختبار"
              value={quizData.description}
              onChange={(e) =>
                setQuizData({ ...quizData, description: e.target.value })
              }
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="تاريخ التسليم"
                value={quizData.dueDate}
                onChange={(newValue) =>
                  setQuizData({ ...quizData, dueDate: newValue })
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

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="الدرجة الكلية"
              value={quizData.totalScore}
              onChange={(e) =>
                setQuizData({ ...quizData, totalScore: Number(e.target.value) })
              }
              required
              size={isMobile ? "small" : "medium"}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {quizData.questions.map((question, questionIndex) => (
            <Grid item xs={12} key={questionIndex}>
              <Card
                variant="outlined"
                sx={{
                  p: isMobile ? 1 : 2,
                  mb: isMobile ? 2 : 3,
                }}
              >
                <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant={isMobile ? "subtitle1" : "h6"}>
                      السؤال {questionIndex + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeQuestion(questionIndex)}
                      size={isMobile ? "small" : "medium"}
                      aria-label="حذف السؤال"
                    >
                      <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </Box>

                  <Grid container spacing={isMobile ? 1 : 2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="نص السؤال"
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
                            "text",
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
                          value={question.type}
                          onChange={(e) =>
                            handleQuestionChange(
                              questionIndex,
                              "type",
                              e.target.value
                            )
                          }
                          label="نوع السؤال"
                        >
                          <MenuItem value="multiple_choice">
                            اختيار من متعدد
                          </MenuItem>
                          <MenuItem value="text">نص</MenuItem>
                          <MenuItem value="file">ملف</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="درجة السؤال"
                        value={question.score}
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
                            "score",
                            Number(e.target.value)
                          )
                        }
                        required
                        size={isMobile ? "small" : "medium"}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    {question.type === "multiple_choice" && (
                      <>
                        {question.options.map((option, optionIndex) => (
                          <Grid item xs={12} key={optionIndex}>
                            <TextField
                              fullWidth
                              label={`الخيار ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(
                                  questionIndex,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              required
                              size={isMobile ? "small" : "medium"}
                            />
                          </Grid>
                        ))}

                        <Grid item xs={12}>
                          <FormControl
                            fullWidth
                            size={isMobile ? "small" : "medium"}
                            sx={{ mt: 1 }}
                          >
                            <InputLabel>الإجابة الصحيحة</InputLabel>
                            <Select
                              value={question.correctAnswer}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  "correctAnswer",
                                  e.target.value
                                )
                              }
                              label="الإجابة الصحيحة"
                            >
                              {question.options.map((_, index) => (
                                <MenuItem key={index} value={index}>
                                  الخيار {index + 1}
                                </MenuItem>
                              ))}
                            </Select>
                            <FormHelperText>
                              اختر رقم الخيار الصحيح
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              startIcon={<AddIcon />}
              onClick={addQuestion}
              variant="outlined"
              fullWidth
              size={isMobile ? "small" : "medium"}
            >
              إضافة سؤال
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Box
              display="flex"
              gap={isMobile ? 1 : 2}
              flexDirection={isMobile ? "column" : "row"}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                size={isMobile ? "medium" : "large"}
                sx={{ mb: isMobile ? 1 : 0 }}
              >
                {loading ? <CircularProgress size={24} /> : "إنشاء الاختبار"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                fullWidth
                size={isMobile ? "medium" : "large"}
              >
                إلغاء
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateQuiz;
