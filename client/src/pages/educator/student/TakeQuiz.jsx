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
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../../context/AppContext";

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
  const { userId } = useAuth();

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${backendUrl}/api/quiz/${quizId}/check-eligibility`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setEligibility(response.data.eligibility);
          if (!response.data.eligibility.canSubmit) {
            setError(response.data.eligibility.reason);
            return;
          }
          // إذا كان مؤهلاً، قم بجلب بيانات الاختبار
          fetchQuiz();
        } else {
          setError("فشل في التحقق من أهلية تقديم الاختبار");
        }
      } catch (err) {
        console.error("Error checking eligibility:", err);
        setError(err.response?.data?.message || "حدث خطأ في التحقق من الأهلية");
      }
    };

    checkEligibility();
  }, [quizId, getToken, backendUrl]);

  useEffect(() => {
    const checkSubmission = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${backendUrl}/api/quiz/${quizId}/check-submission`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.submitted) {
          setError("لقد قمت بتقديم هذا الاختبار من قبل");
          setQuiz(null);
          return;
        }

        // إذا لم يكن قد قدم الاختبار، قم بجلب بيانات الاختبار
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
          const duration = Number(quizResponse.data.quiz.duration) || 60;
          setTimeLeft(duration * 60);
          setAnswers(
            quizResponse.data.quiz.questions.reduce((acc, q) => {
              acc[q._id] = q.questionType === "multiple_choice" ? "" : "";
              return acc;
            }, {})
          );
        } else {
          setError(quizResponse.data.message || "فشل في جلب بيانات الاختبار");
        }
      } catch (err) {
        console.error("Error:", err);
        setError(
          err.response?.data?.message || "حدث خطأ في جلب بيانات الاختبار"
        );
      } finally {
        setLoading(false);
      }
    };

    checkSubmission();
  }, [quizId, getToken, backendUrl]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();

      // التحقق من أن جميع الأسئلة تمت الإجابة عليها
      const unansweredQuestions = quiz.questions.filter(
        (question) => !answers[question._id]
      );

      if (unansweredQuestions.length > 0) {
        setError("يرجى الإجابة على جميع الأسئلة قبل التقديم");
        return;
      }

      // تنسيق الإجابات بالشكل المطلوب
      const formattedAnswers = quiz.questions.map((question) => {
        const answer = answers[question._id];
        console.log("Processing question:", question);
        console.log("Answer for question:", answer);

        // معالجة الإجابات النصية
        if (question.questionType === "text") {
          return {
            question: question._id,
            answer: answer,
            isCorrect: false,
            score: 0,
          };
        }

        // معالجة الإجابات متعددة الخيارات
        const selectedOption = question.options.find(
          (opt) => opt.text === answer
        );
        console.log("Selected option:", selectedOption);

        if (!selectedOption) {
          throw new Error(`Invalid answer for question ${question._id}`);
        }

        return {
          question: question._id,
          answer: answer,
          isCorrect: selectedOption.isCorrect,
          score: selectedOption.isCorrect ? parseInt(question.marks) : 0,
        };
      });

      const submissionData = {
        student: userId,
        answers: formattedAnswers,
        submittedAt: new Date().toISOString(),
      };

      console.log("Submitting data:", JSON.stringify(submissionData, null, 2));

      const response = await axios.post(
        `${backendUrl}/api/quiz/${quizId}/submit`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        navigate(`/course/${quiz.course._id}/quizzes`);
      } else {
        setError(response.data.message || "فشل في تقديم الاختبار");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || "حدث خطأ في تقديم الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={4}>
      <Container maxWidth="lg">
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="50vh"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" py={10}>
            <Alert severity="warning" sx={{ mb: 4 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/course/${quiz?.course?._id}/quizzes`)}
            >
              العودة إلى قائمة الاختبارات
            </Button>
          </Box>
        ) : quiz ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom align="center">
              {quiz.title}
            </Typography>

            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography variant="h6" color="primary">
                الوقت المتبقي: {formatTime(timeLeft)}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                السؤال {currentQuestion + 1}:{" "}
                {quiz.questions[currentQuestion].questionText}
              </Typography>

              {quiz.questions[currentQuestion].questionType ===
              "multiple_choice" ? (
                <FormControl component="fieldset">
                  <RadioGroup
                    value={answers[quiz.questions[currentQuestion]._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        quiz.questions[currentQuestion]._id,
                        e.target.value
                      )
                    }
                  >
                    {quiz.questions[currentQuestion].options.map(
                      (option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option.text}
                          control={<Radio />}
                          label={option.text}
                        />
                      )
                    )}
                  </RadioGroup>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={answers[quiz.questions[currentQuestion]._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(
                      quiz.questions[currentQuestion]._id,
                      e.target.value
                    )
                  }
                  placeholder="اكتب إجابتك هنا..."
                  variant="outlined"
                />
              )}
            </Box>

            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  السابق
                </Button>
              </Grid>
              <Grid item>
                {currentQuestion === quiz.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "جاري التقديم..." : "تقديم الاختبار"}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    التالي
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>
        ) : null}
      </Container>
    </Box>
  );
};

export default TakeQuiz;
