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
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import{ backendUrl } from "../../../config";
const CreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
         `${backendUrl}/quiz/course/${courseId}`,    
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
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        إنشاء اختبار جديد
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="عنوان الاختبار"
              value={quizData.title}
              onChange={(e) =>
                setQuizData({ ...quizData, title: e.target.value })
              }
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="وصف الاختبار"
              value={quizData.description}
              onChange={(e) =>
                setQuizData({ ...quizData, description: e.target.value })
              }
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
                renderInput={(params) => <TextField {...params} fullWidth />}
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
            />
          </Grid>

          {quizData.questions.map((question, questionIndex) => (
            <Grid item xs={12} key={questionIndex}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">
                      السؤال {questionIndex + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
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
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
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
                            />
                          </Grid>
                        ))}

                        <Grid item xs={12}>
                          <FormControl fullWidth>
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
            >
              إضافة سؤال
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "إنشاء الاختبار"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                fullWidth
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
