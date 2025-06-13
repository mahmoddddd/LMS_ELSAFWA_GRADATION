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
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  // Add share functionality
  const handleShare = async (platform) => {
    const courseUrl = window.location.href;
    const courseTitle = courseData.courseTitle;
    const shareText = `Check out this course: ${courseTitle}`;

    try {
      switch (platform) {
        case "copy":
          await navigator.clipboard.writeText(courseUrl);
          toast.success("Link copied to clipboard!");
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              courseUrl
            )}`,
            "_blank"
          );
          break;
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}&url=${encodeURIComponent(courseUrl)}`,
            "_blank"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              courseUrl
            )}`,
            "_blank"
          );
          break;
        case "whatsapp":
          window.open(
            `https://wa.me/?text=${encodeURIComponent(
              `${shareText} ${courseUrl}`
            )}`,
            "_blank"
          );
          break;
      }
      setShowShareMenu(false);
    } catch (error) {
      toast.error("Failed to share. Please try again.");
    }
  };

  if (!courseData) {
    return <Loading />;
  }

  const courseDuration = calculateCourseDuration(courseData);
  const totalLectures = calculateNoOfLectures(courseData);
  const rating = calculateRating(courseData);

  return (
    <div className="min-h-screen bg-white">
      {courseData ? (
        <>
          {/* Top Navigation Bar */}
          <div className="border-b border-gray-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={courseData.courseThumbnail}
                    alt={courseData.courseTitle}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <h1 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {courseData.courseTitle}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {rating} ({courseData.courseRatings?.length || 0} ratings)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {totalLectures} lectures •{" "}
                    {humanizeDuration(courseDuration * 60 * 1000, {
                      units: ["h", "m"],
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Course Content */}
              <div className="lg:col-span-2">
                {/* Course Preview Video */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-8">
                  <img
                    src={courseData.courseThumbnail}
                    alt={courseData.courseTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Course Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    About this course
                  </h2>
                  <div
                    className="prose max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html: courseData.courseDescription,
                    }}
                  />
                </div>

                {/* Course Content */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Course content
                  </h2>
                  <div className="space-y-2">
                    {courseData.courseContent?.map((chapter, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                                openSection[index] ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-900">
                                {chapter.chapterTitle}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {chapter.chapterContent.length} lectures •{" "}
                                {calculateChapterTime(chapter)}
                              </p>
                            </div>
                          </div>
                        </button>
                        {openSection[index] && (
                          <div className="border-t border-gray-200">
                            {chapter.chapterContent.map(
                              (lecture, lectureIndex) => (
                                <div
                                  key={lectureIndex}
                                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-gray-700">
                                      {lecture.lectureTitle}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {humanizeDuration(
                                      lecture.lectureDuration * 60 * 1000,
                                      { units: ["h", "m"] }
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Enrollment Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 border border-gray-200 rounded-lg overflow-hidden">
                  {/* Course Preview Image */}
                  <div className="aspect-video bg-black">
                    <img
                      src={courseData.courseThumbnail}
                      alt={courseData.courseTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Price and Enrollment */}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {currency}
                        {courseData.coursePrice}
                      </div>
                      {courseData.discount > 0 && (
                        <div className="text-sm text-gray-500 line-through">
                          {currency}
                          {courseData.coursePrice +
                            (courseData.discount * courseData.coursePrice) /
                              100}
                        </div>
                      )}
                    </div>

                    {isAlreadyEnrolled ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate(`/player/${courseData._id}`)}
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Continue Learning
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/course/${courseData._id}/quizzes`)
                          }
                          className="w-full bg-white text-gray-900 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          Take Quizzes
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={enrollCourse}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Enroll Now
                          </>
                        )}
                      </button>
                    )}

                    <div className="mt-6 space-y-4">
                      <h3 className="font-bold text-gray-900">
                        This course includes:
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-600">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Lifetime access</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span>Downloadable resources</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          <span>30-day money-back guarantee</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="w-full text-center text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                          Share
                        </button>

                        {showShareMenu && (
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button
                              onClick={() => handleShare("copy")}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                />
                              </svg>
                              Copy Link
                            </button>
                            <button
                              onClick={() => handleShare("facebook")}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 text-[#1877F2]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              Facebook
                            </button>
                            <button
                              onClick={() => handleShare("twitter")}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 text-[#1DA1F2]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Twitter
                            </button>
                            <button
                              onClick={() => handleShare("linkedin")}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 text-[#0A66C2]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              LinkedIn
                            </button>
                            <button
                              onClick={() => handleShare("whatsapp")}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 text-[#25D366]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Loading />
      )}
      <Footer />
    </div>
  );
};

export default CourseDetails;
