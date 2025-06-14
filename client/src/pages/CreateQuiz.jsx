// أهم التعديلات:
// - استخدمت `xs={12}` دايمًا بحيث كل عنصر يحتل العرض كامل على الموبايل.
// - حافظت على `md={6}` للعناصر اللي عايزينها نص عرض على الشاشات الكبيرة.
// - ضفت gap (فجوات) بين عناصر الـ Box لما يكون فيه أكثر من زر.
// - أضفت maxWidth و margin أو padding متناسق عشان يبقى العرض مريح على الموبايل.

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ar } from "date-fns/locale";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const CreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    totalMarks: 0,
    questions: [
      {
        questionText: "",
        questionType: "multiple_choice",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        marks: 0,
      },
    ],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuizData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = {
        ...newQuestions[index],
        [field]: value,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options[optionIndex] = {
        ...newQuestions[questionIndex].options[optionIndex],
        [field]: value,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          questionType: "multiple_choice",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
          marks: 0,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options.push({ text: "", isCorrect: false });
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options = newQuestions[
        questionIndex
      ].options.filter((_, i) => i !== optionIndex);
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/quiz`, quizData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate(`/courses/${courseId}/quizzes`);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ في إنشاء الاختبار");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} maxWidth="900px" mx="auto">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إنشاء اختبار جديد
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="عنوان الاختبار"
                name="title"
                value={quizData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف الاختبار"
                name="description"
                value={quizData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={ar}
              >
                <DateTimePicker
                  label="تاريخ التسليم"
                  value={quizData.dueDate}
                  onChange={(newValue) =>
                    setQuizData((prev) => ({ ...prev, dueDate: newValue }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الدرجة الكلية"
                name="totalMarks"
                type="number"
                value={quizData.totalMarks}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            {quizData.questions.map((question, questionIndex) => (
              <Grid item xs={12} key={questionIndex}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Typography variant="h6" flexGrow={1}>
                      السؤال {questionIndex + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeQuestion(questionIndex)}
                      disabled={quizData.questions.length === 1}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="نص السؤال"
                        value={question.questionText}
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
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
                            handleQuestionChange(
                              questionIndex,
                              "questionType",
                              e.target.value
                            )
                          }
                          label="نوع السؤال"
                        >
                          <MenuItem value="multiple_choice">
                            اختيار من متعدد
                          </MenuItem>
                          <MenuItem value="text">إجابة نصية</MenuItem>
                          <MenuItem value="file">رفع ملف</MenuItem>
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
                          handleQuestionChange(
                            questionIndex,
                            "marks",
                            Number(e.target.value)
                          )
                        }
                        required
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    {question.questionType === "multiple_choice" && (
                      <>
                        {question.options.map((option, optionIndex) => (
                          <Grid item xs={12} key={optionIndex}>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              flexWrap="wrap"
                            >
                              <TextField
                                fullWidth
                                label={`الخيار ${optionIndex + 1}`}
                                value={option.text}
                                onChange={(e) =>
                                  handleOptionChange(
                                    questionIndex,
                                    optionIndex,
                                    "text",
                                    e.target.value
                                  )
                                }
                                required
                              />
                              <Button
                                variant={
                                  option.isCorrect ? "contained" : "outlined"
                                }
                                color={option.isCorrect ? "success" : "primary"}
                                onClick={() =>
                                  handleOptionChange(
                                    questionIndex,
                                    optionIndex,
                                    "isCorrect",
                                    !option.isCorrect
                                  )
                                }
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {option.isCorrect
                                  ? "إجابة صحيحة"
                                  : "إجابة خاطئة"}
                              </Button>
                              <IconButton
                                color="error"
                                onClick={() =>
                                  removeOption(questionIndex, optionIndex)
                                }
                                disabled={question.options.length === 2}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                        <Grid item xs={12}>
                          <Button
                            startIcon={<AddIcon />}
                            onClick={() => addOption(questionIndex)}
                            disabled={question.options.length >= 4}
                            fullWidth={false}
                          >
                            إضافة خيار
                          </Button>
                        </Grid>
                      </>
                    )}

                    {question.questionType === "file" && (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>نوع الملف المسموح به</InputLabel>
                          <Select
                            value={question.fileType || "pdf"}
                            onChange={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                "fileType",
                                e.target.value
                              )
                            }
                            label="نوع الملف المسموح به"
                          >
                            <MenuItem value="pdf">PDF</MenuItem>
                            <MenuItem value="doc">Word Document</MenuItem>
                            <MenuItem value="docx">
                              Word Document (DOCX)
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
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
              <Box
                display="flex"
                gap={2}
                flexDirection={{ xs: "column", sm: "row" }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                  sx={{ mb: { xs: 1, sm: 0 } }}
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
      </Paper>
    </Box>
  );
};

export default CreateQuiz;
