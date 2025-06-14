import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";

const QuizDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`/api/educator/quizzes/${quizId}`);
        setQuiz(response.data);
      } catch (e) {
        setError(e.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <NavigationButtons
        backPath="/educator/quizzes"
        forwardPath={`/educator/quizzes/${quizId}/edit`}
        backText="العودة للاختبارات"
        forwardText="تعديل الاختبار"
        showHome={true}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          {/* ... existing quiz details ... */}

          <NavigationButtons
            backPath={null}
            forwardPath={`/educator/quizzes/${quizId}/submissions`}
            backText="إلغاء"
            forwardText="عرض التقديمات"
            showHome={false}
            onBackClick={() => navigate("/educator/quizzes")}
          />
        </Box>
      )}
    </Container>
  );
};

export default QuizDetail;
