import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/AppContext.jsx";
import Loading from "../../../components/student/Loading";
import { assets } from "../../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../../components/student/Footer";
import YouTube from "react-youtube";
import { toast } from "react-toastify";
import axios from "axios";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    allCourses,
    calculateRating,
    calculateNoOfLectures,
    calculateChapterTime,
    calculateCourseDuration,
    currency,
    backendUrl,
    userData,
    getToken,
    fetchUserEnrolledCourses,
    enrolledCourses,
  } = useContext(AppContext);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`);
      if (data.success) {
        setCourseData(data.courseData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      console.log("🔍 Checking enrollment status for course:", id);
      const { data } = await axios.get(
        `${backendUrl}/api/user/enrollment-status/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📝 Enrollment status response:", data);
      if (data.success) {
        setIsAlreadyEnrolled(data.isEnrolled);
        // Refresh user data if enrollment status changed
        if (data.isEnrolled && !isAlreadyEnrolled) {
          console.log("🔄 Enrollment status changed, refreshing user data");
          await fetchUserEnrolledCourses();
        }
      }
    } catch (error) {
      console.error("❌ Error checking enrollment status:", error);
    }
  };

  // Add useEffect to check enrollment status when component mounts or after payment
  useEffect(() => {
    // Check if coming back from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get("payment_success");

    if (paymentSuccess === "true") {
      console.log("💰 Payment successful, checking enrollment status");
      // Wait a bit for webhook to process, then check enrollment
      setTimeout(() => {
        checkEnrollmentStatus();
      }, 3000); // Increased delay to ensure webhook has time to process
    }
  }, []);

  // Modified enrollment check useEffect
  useEffect(() => {
    if (userData && courseData) {
      console.log("🔄 Checking enrollment status:", {
        courseId: courseData._id,
        userEnrolledCourses: userData.enrolledCourses,
        contextEnrolledCourses: enrolledCourses.map((c) => c._id),
      });

      // Check if user is enrolled in this specific course
      const isEnrolled =
        userData.enrolledCourses?.some((courseId) => {
          // Handle both ObjectId and string comparisons
          const enrolledCourseId =
            typeof courseId === "object" ? courseId.toString() : courseId;
          return enrolledCourseId === courseData._id.toString();
        }) ||
        enrolledCourses.some(
          (course) => course._id.toString() === courseData._id.toString()
        );

      console.log("📝 Enrollment check result:", isEnrolled);
      setIsAlreadyEnrolled(isEnrolled);
    }
  }, [userData, courseData, enrolledCourses]);

  // Modified enroll function with better error handling
  const enrollCourse = async () => {
    try {
      setIsLoading(true);

      // Check if user is logged in
      if (!userData) {
        toast.warn("Please login to enroll in this course");
        return;
      }

      // Check if already enrolled
      if (isAlreadyEnrolled) {
        toast.warn("You are already enrolled in this course");
        return;
      }

      // Get authentication token
      const token = await getToken();
      if (!token) {
        toast.warn("Authentication failed. Please login again.");
        return;
      }

      console.log("🔄 Initiating course enrollment for:", courseData._id);
      // Make purchase request
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data.success) {
        const { session_url } = data;
        if (session_url) {
          console.log("✅ Purchase session created, redirecting to payment");
          // Add payment success parameter to success URL
          const successUrl = new URL(session_url);
          // Store current course ID in localStorage for checking after payment
          localStorage.setItem("pendingEnrollmentCourseId", courseData._id);

          // Redirect to Stripe checkout
          window.location.replace(session_url);
        } else {
          toast.error("Payment session could not be created");
        }
      } else {
        toast.error(data.message || "Failed to initiate enrollment");
      }
    } catch (error) {
      console.error("❌ Enrollment error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 400) {
        toast.error(
          error.response.data.message ||
            "You are already enrolled in this course"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to enroll. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch course data on component mount
  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, backendUrl]);

  // Fetch user enrolled courses when userData changes
  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  // Check enrollment status when userData or courseData changes
  useEffect(() => {
    if (userData && courseData) {
      // Check if user is enrolled in this specific course
      const isEnrolled =
        userData.enrolledCourses?.includes(courseData._id) ||
        enrolledCourses.some((course) => course._id === courseData._id);
      setIsAlreadyEnrolled(isEnrolled);
    }
  }, [userData, courseData, enrolledCourses]);

  const toggleSection = (index) => {
    setOpenSection((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!courseData) {
    return <Loading />;
  }

  const courseDuration = calculateCourseDuration(courseData);
  const totalLectures = calculateNoOfLectures(courseData);
  const rating = calculateRating(courseData);

  return (
    <div className="min-h-screen bg-gray-50">
      {courseData ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative">
              <img
                src={courseData.courseThumbnail}
                alt={courseData.courseTitle}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white text-center">
                  {courseData.courseTitle}
                </h1>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <img
                    src={
                      courseData.educator?.profileImage || assets.defaultProfile
                    }
                    alt={courseData.educator?.name || "Educator"}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <span className="text-gray-700">
                    {courseData.educator?.name || "Unknown Educator"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700">{courseDuration}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700">
                    {totalLectures} Lectures
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700">Rating: {rating}/5</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                {isAlreadyEnrolled && (
                  <>
                    <button
                      onClick={() => navigate(`/player/${courseData._id}`)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      مشاهدة المحتوى
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/course/${courseData._id}/quizzes`)
                      }
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      الاختبارات
                    </button>
                  </>
                )}
                {!isAlreadyEnrolled && (
                  <button
                    onClick={enrollCourse}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading
                      ? "جاري التسجيل..."
                      : `تسجيل في المقرر (${currency}${courseData.coursePrice})`}
                  </button>
                )}
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">وصف المقرر</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: courseData.courseDescription,
                  }}
                />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">المحتوى</h2>
                {courseData.courseContent?.map((chapter, index) => (
                  <div key={index} className="mb-4">
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <span className="font-semibold">
                        {chapter.chapterTitle}
                      </span>
                      <span>{openSection[index] ? "−" : "+"}</span>
                    </button>
                    {openSection[index] && (
                      <div className="mt-2 p-4 bg-white rounded-lg shadow">
                        {chapter.chapterContent.map((lecture, lectureIndex) => (
                          <div
                            key={lectureIndex}
                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                          >
                            <div className="flex items-center">
                              <img
                                src={assets.play_icon}
                                alt="Play"
                                className="w-5 h-5 mr-2"
                              />
                              <span>{lecture.lectureTitle}</span>
                            </div>
                            <span className="text-gray-500">
                              {humanizeDuration(
                                lecture.lectureDuration * 1000,
                                {
                                  language: "ar",
                                }
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Loading />
      )}
      <Footer />
    </div>
  );
};

export default CourseDetails;
