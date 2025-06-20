import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";
import useMediaQuery from "@mui/material/useMediaQuery";
import EventIcon from "@mui/icons-material/Event";
import QuizIcon from "@mui/icons-material/Quiz";
import DoneIcon from "@mui/icons-material/Done";
import LockIcon from "@mui/icons-material/Lock";

// ... existing code ...

const Quizzes = () => {
  // ... existing code ...
  const isMobile = useMediaQuery("(max-width:600px)");
  // ... existing code ...
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <NavigationButtons
        backPath="/dashboard"
        forwardPath="/educator/create-quiz"
        backText="العودة للوحة التحكم"
        forwardText="إنشاء اختبار جديد"
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
      ) : isMobile ? (
        <Grid container spacing={1}>
          {quizzes.map((quiz) => {
            // Determine status
            const now = new Date();
            const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null;
            let status = {
              label: "مفتوح",
              color: "primary",
              icon: <QuizIcon fontSize="small" />,
            };
            if (dueDate && now > dueDate) {
              status = {
                label: "منتهي",
                color: "error",
                icon: <LockIcon fontSize="small" />,
              };
            } else if (quiz.submission) {
              status = {
                label: "تم التقديم",
                color: "success",
                icon: <DoneIcon fontSize="small" />,
              };
            }
            return (
              <Grid item xs={12} key={quiz._id}>
                <Card
                  sx={{
                    p: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6" fontWeight={600} flex={1}>
                      {quiz.title}
                    </Typography>
                    <Chip
                      icon={status.icon}
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </Box>
                  {quiz.course?.title && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {quiz.course.title}
                    </Typography>
                  )}
                  {quiz.description && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {quiz.description}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    {quiz.dueDate && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {new Date(quiz.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
                      <QuizIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {quiz.questions?.length || 0} سؤال
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الدرجة: {quiz.totalMarks}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1, alignSelf: "flex-end" }}
                    onClick={() => navigate(`/educator/quizzes/${quiz._id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Grid container spacing={4}>
          {quizzes.map((quiz) => {
            // Determine status
            const now = new Date();
            const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null;
            let status = {
              label: "مفتوح",
              color: "primary",
              icon: <QuizIcon fontSize="small" />,
            };
            if (dueDate && now > dueDate) {
              status = {
                label: "منتهي",
                color: "error",
                icon: <LockIcon fontSize="small" />,
              };
            } else if (quiz.submission) {
              status = {
                label: "تم التقديم",
                color: "success",
                icon: <DoneIcon fontSize="small" />,
              };
            }
            return (
              <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                <Card
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6" fontWeight={600} flex={1}>
                      {quiz.title}
                    </Typography>
                    <Chip
                      icon={status.icon}
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </Box>
                  {quiz.course?.title && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {quiz.course.title}
                    </Typography>
                  )}
                  {quiz.description && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {quiz.description}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    {quiz.dueDate && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {new Date(quiz.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
                      <QuizIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {quiz.questions?.length || 0} سؤال
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الدرجة: {quiz.totalMarks}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1, alignSelf: "flex-end" }}
                    onClick={() => navigate(`/educator/quizzes/${quiz._id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Quizzes;
// ... existing code ...
