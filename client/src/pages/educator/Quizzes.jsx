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
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";
import useMediaQuery from "@mui/material/useMediaQuery";

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
      ) : (
        isMobile ? (
          <Grid container spacing={2}>
            {quizzes.map((quiz) => (
              <Grid item xs={12} key={quiz._id}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={600}>{quiz.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{quiz.course?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Marks: {quiz.totalMarks}</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate(`/educator/quizzes/${quiz._id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={4}>
            {quizzes.map((quiz) => (
              // ... existing quiz card code ...
            ))}
          </Grid>
        )
      )}
    </Container>
  );
};

export default Quizzes;
// ... existing code ... 