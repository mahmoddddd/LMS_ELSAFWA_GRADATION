import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../../context/AppContext";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { backendUrl } = useContext(AppContext);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        // First check eligibility
        const eligibilityResponse = await axios.get(
          `${backendUrl}/api/quiz/${quizId}/check-eligibility`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!eligibilityResponse.data.success) {
          setError("فشل في التحقق من أهلية تقديم الاختبار");
          return;
        }

        setEligibility(eligibilityResponse.data.eligibility);
        if (!eligibilityResponse.data.eligibility.canSubmit) {
          setError(eligibilityResponse.data.eligibility.reason);
          return;
        }

        // Fetch quiz data
        const quizResponse = await axios.get(
          `${backendUrl}/api/quiz/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (quizResponse.data.success) {
          setQuiz(quizResponse.data.quiz);
          // Initialize answers object
          const initialAnswers = {};
          quizResponse.data.quiz.questions.forEach((question) => {
            initialAnswers[question._id] = {
              answer: question.questionType === "multiple_choice" ? "" : "",
              file: null,
            };
          });
          setAnswers(initialAnswers);
        } else {
          setError("فشل في تحميل بيانات الاختبار");
        }
      } catch (error) {
        setError("حدث خطأ أثناء تحميل بيانات الاختبار");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer: value },
    }));
  };

  const handleFileChange = (questionId, file) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], file },
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();

      if (quiz.isFileQuiz) {
        // Handle file quiz submission
        const formData = new FormData();
        formData.append("quizId", quizId);
        formData.append("answerFile", answerFile);

        const response = await axios.post(
          `${backendUrl}/api/quiz/${quizId}/submit`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          navigate("/my-quizzes");
        }
      } else {
        // Handle regular quiz submission
        const formattedAnswers = quiz.questions
          .map((question) => {
            const answer = answers[question._id];
            if (!answer) return null;

            if (question.questionType === "multiple_choice") {
              return {
                questionId: question._id,
                selectedOption: answer.answer,
              };
            } else if (question.questionType === "text") {
              return {
                questionId: question._id,
                textAnswer: answer.answer,
              };
            }
            return null;
          })
          .filter(Boolean);

        console.log("Sending answers:", formattedAnswers);

        const response = await axios.post(
          `${backendUrl}/api/quiz/${quizId}/submit`,
          {
            answers: formattedAnswers,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          console.log("Submission response:", response.data);
          navigate("/my-quizzes");
        }
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError(error.response?.data?.message || "حدث خطأ أثناء تقديم الإجابات");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {quiz.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {quiz.description}
        </Typography>

        {quiz.isFileQuiz ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              تحميل ملف الإجابة
            </Typography>
            {quiz.quizFile && (
              <Box
                sx={{ mb: 3, p: 2, border: "1px solid #ddd", borderRadius: 1 }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  معلومات ملف الكويز:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  نوع الملف: {quiz.quizFile.fileType || "PDF"}
                </Typography>
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    component="a"
                    href={quiz.quizFile.fileUrl}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      // فتح الملف في نافذة جديدة
                      window.open(quiz.quizFile.fileUrl, "_blank");
                    }}
                    startIcon={<DownloadIcon />}
                  >
                    عرض الملف
                  </Button>
                  <Button
                    variant="outlined"
                    component="a"
                    href={quiz.quizFile.fileUrl}
                    download={`quiz_${
                      quiz.title
                    }.${quiz.quizFile.fileType?.split("/")[1] || "pdf"}`}
                    onClick={(e) => {
                      e.preventDefault();
                      // تحميل الملف مباشرة
                      const link = document.createElement("a");
                      link.href = quiz.quizFile.fileUrl;
                      link.download = `quiz_${
                        quiz.title
                      }.${quiz.quizFile.fileType?.split("/")[1] || "pdf"}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    startIcon={<DownloadIcon />}
                  >
                    تحميل الملف
                  </Button>
                </Box>
                {quiz.quizFile.fileUrl && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    رابط الملف: {quiz.quizFile.fileUrl}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                رفع ملف الإجابة
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setAnswerFile(e.target.files[0])}
                />
              </Button>
              {answerFile && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    معلومات ملف الإجابة:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    اسم الملف: {answerFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نوع الملف: {answerFile.type || "غير معروف"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    حجم الملف: {(answerFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box>
            {quiz.questions.map((question, index) => (
              <Card key={question._id} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    السؤال {index + 1}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {question.questionText}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    الدرجة: {question.marks}
                  </Typography>

                  {question.questionType === "multiple_choice" ? (
                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                      <RadioGroup
                        value={answers[question._id]?.answer || ""}
                        onChange={(e) =>
                          handleAnswerChange(question._id, e.target.value)
                        }
                      >
                        {question.options.map((option, optionIndex) => (
                          <FormControlLabel
                            key={optionIndex}
                            value={option.text}
                            control={<Radio />}
                            label={option.text}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="إجابتك"
                        value={answers[question._id]?.answer || ""}
                        onChange={(e) =>
                          handleAnswerChange(question._id, e.target.value)
                        }
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "تقديم الإجابات"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TakeQuiz;
