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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import QuizIcon from "@mui/icons-material/Quiz";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const courseResponse = await axios.get(
          `${backendUrl}/api/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (courseResponse.data.success) {
          setCourse(courseResponse.data.course);

          const quizzesResponse = await axios.get(
            `${backendUrl}/api/courses/${courseId}/quizzes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (quizzesResponse.data.success) {
            setQuizzes(quizzesResponse.data.quizzes);
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "حدث خطأ في تحميل بيانات الكورس"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, getToken, backendUrl]);

  const handleDeleteCourse = async () => {
    if (window.confirm("هل أنت متأكد من حذف هذا الكورس؟")) {
      try {
        const token = await getToken();
        await axios.delete(`${backendUrl}/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        navigate("/educator/courses");
      } catch (err) {
        setError(err.response?.data?.message || "حدث خطأ في حذف الكورس");
      }
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
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, md: 4 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <NavigationButtons
          backPath="/educator/courses"
          backText="العودة للكورسات"
          showHome={true}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, md: 4 } }}>
      <NavigationButtons
        backPath="/educator/courses"
        forwardPath={`/educator/courses/${courseId}/edit`}
        backText="العودة للكورسات"
        forwardText="تعديل الكورس"
        showHome={true}
      />

      {/* Course Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {course?.courseTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {course?.courseDescription}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={course?.isPublished ? "منشور" : "مسودة"}
                  color={course?.isPublished ? "success" : "default"}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`${course?.enrolledStudents?.length || 0} طالب مسجل`}
                  color="primary"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`${course?.coursePrice} ريال`}
                  color="secondary"
                  sx={{ mb: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              {course?.courseThumbnail && (
                <Box
                  component="img"
                  src={course.courseThumbnail}
                  alt={course.courseTitle}
                  sx={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 1,
                    maxHeight: 250,
                    objectFit: "cover",
                  }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            محتوى الكورس
          </Typography>
          <List>
            {course?.courseContent?.map((chapter, index) => (
              <React.Fragment key={chapter.chapterId}>
                <ListItem>
                  <ListItemIcon>
                    <VideoLibraryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={chapter.chapterTitle}
                    secondary={`${chapter.chapterContent.length} محاضرة`}
                  />
                </ListItem>
                {index < course.courseContent.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Course Quizzes */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h5">اختبارات الكورس</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/educator/courses/${courseId}/add-quiz`)}
            >
              إضافة اختبار
            </Button>
          </Box>
          <List>
            {quizzes.map((quiz, index) => (
              <React.Fragment key={quiz._id}>
                <ListItem
                  sx={{
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 1,
                  }}
                >
                  <ListItemIcon>
                    <QuizIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={quiz.title}
                    secondary={`${quiz.totalMarks} درجة`}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/educator/quizzes/${quiz._id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </ListItem>
                {index < quizzes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {quizzes.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="لا توجد اختبارات"
                  secondary="قم بإضافة اختبار جديد للكورس"
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Bottom Navigation Buttons */}
      <NavigationButtons
        backPath={null}
        forwardPath={null}
        backText="حذف الكورس"
        forwardText="تعديل الكورس"
        showHome={false}
        onBackClick={handleDeleteCourse}
        onForwardClick={() => navigate(`/educator/courses/${courseId}/edit`)}
      />
    </Container>
  );
};

export default CourseDetail;
