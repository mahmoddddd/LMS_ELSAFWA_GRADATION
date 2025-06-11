import { Route, Routes, useMatch } from "react-router-dom";

import Home from "./pages/educator/student/Home";
import CourseList from "./pages/educator/student/CourseList";
import CourseDetails from "./pages/educator/student/CourseDetails";
import MyEnrollments from "./pages/educator/student/MyEnrollments";
import Player from "./pages/educator/student/Player";
import Loading from "./components/student/Loading";
import Educator from "./pages/educator/Educator";
import DashBoard from "./pages/educator/DashBoard";
import AddCourse from "./pages/educator/AddCourse";
import EditCourse from "./pages/educator/EditCourse";
import StudentEnrolled from "./pages/educator/StudentEnrolled";
import MyCourse from "./pages/educator/MyCourse";
import Navbar from "./components/student/Navbar";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import AboutUs from "./components/student/AboutUs";
import ContactUs from "./components/student/ContactUs";
import PolicyPrivacy from "./components/student/PolicyPrivacy";
import LoadingMyEnrollments from "./pages/loading/MyEnrollments";
import AboutLMS from "./pages/AboutLMS";
import QuizManagement from "./pages/educator/QuizManagement";
import QuizSubmissions from "./pages/educator/QuizSubmissions";
import QuizAnalytics from "./pages/educator/QuizAnalytics";
import AddQuiz from "./pages/educator/AddQuiz";
import CourseQuizzes from "./pages/educator/student/CourseQuizzes";
import TakeQuiz from "./pages/educator/student/TakeQuiz";
import StudentQuizAnalytics from "./pages/educator/student/StudentQuizAnalytics";

const App = () => {
  const isEducatorRoute = useMatch("/educator/*");
  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer />
      {!isEducatorRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/course-list" element={<CourseList />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/course-list/:input" element={<CourseList />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route
          path="/loading/my-enrollments"
          element={<LoadingMyEnrollments />}
        />

        {/* Student Quiz Routes */}
        <Route path="/course/:courseId/quizzes" element={<CourseQuizzes />} />
        <Route path="/quiz/:quizId/take" element={<TakeQuiz />} />
        <Route path="/my-quizzes" element={<StudentQuizAnalytics />} />

        {/* Educator Routes */}
        <Route path="/educator" element={<Educator />}>
          <Route index element={<DashBoard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="edit-course/:courseId" element={<EditCourse />} />
          <Route path="my-courses" element={<MyCourse />} />
          <Route path="student-enrolled" element={<StudentEnrolled />} />

          {/* Quiz Management Routes */}
          <Route path="quizzes" element={<QuizManagement />} />
          <Route path="add-quiz" element={<AddQuiz />} />
          <Route
            path="quizzes/:quizId/submissions"
            element={<QuizSubmissions />}
          />
          <Route path="quizzes/:quizId/analytics" element={<QuizAnalytics />} />
        </Route>
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/policy" element={<PolicyPrivacy />} />
        <Route path="/about-lms" element={<AboutLMS />} />
      </Routes>
    </div>
  );
};

export default App;
