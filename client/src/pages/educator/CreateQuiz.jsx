import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../utils/auth';
import { AppContext } from '../../context/AppContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

const CreateQuiz = () => {
  const { backendUrl } = useContext(AppContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [courseId, setCourseId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          title,
          description,
          duration,
          courseId,
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (quizResponse.data.success) {
        // إضافة الاختبار إلى مصفوفة الاختبارات في الكورس
        await axios.put(
          `${backendUrl}/api/course/${courseId}/add-quiz`,
          {
            quizId: quizResponse.data.quiz._id
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        navigate(`/course/${courseId}/quizzes`);
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

  return (
    <Box p={4}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            إنشاء اختبار جديد
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="وصف الاختبار"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth