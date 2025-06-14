import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/AppContext";
import Footer from "../../../components/student/Footer";
import { toast } from "react-toastify";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLectures,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);
  const [quizProgressArray, setQuizProgressArray] = useState([]);
  const [searchParams] = useSearchParams();
  const shouldRefresh = searchParams.get("refresh") === "true";

  const getCourseProgress = async () => {
    try {
      const token = await getToken();

      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          let totalLectures = calculateNoOfLectures(course);
          const lectureCompleted = data.progressData
            ? data.progressData.lectureCompleted.length
            : 0;
          return { totalLectures, lectureCompleted };
        })
      );

      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getQuizProgress = async () => {
    try {
      const token = await getToken();

      const tempQuizProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const { data } = await axios.get(
              `${backendUrl}/api/quiz/course/${course._id}/progress`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (data.success) {
              return {
                totalQuizzes: data.progress.totalQuizzes,
                completedQuizzes: data.progress.completedQuizzes,
                averageScore: data.progress.averageScore,
                hasQuizzes: data.progress.totalQuizzes > 0,
              };
            } else {
              return {
                totalQuizzes: 0,
                completedQuizzes: 0,
                averageScore: 0,
                hasQuizzes: false,
              };
            }
          } catch (error) {
            // If there's an error (like no quizzes), return default values
            return {
              totalQuizzes: 0,
              completedQuizzes: 0,
              averageScore: 0,
              hasQuizzes: false,
            };
          }
        })
      );

      setQuizProgressArray(tempQuizProgressArray);
    } catch (error) {
      console.error("Error fetching quiz progress:", error);
      // Set default values if there's an error
      setQuizProgressArray(
        enrolledCourses.map(() => ({
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          hasQuizzes: false,
        }))
      );
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
      getQuizProgress();
    }
  }, [enrolledCourses]);

  useEffect(() => {
    if (shouldRefresh) {
      fetchUserEnrolledCourses();
      toast.success("Your enrollments have been updated!");
    }
  }, [shouldRefresh]);

  if (!enrolledCourses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="md:px-36 px-6 pt-10">
        <h1 className="text-2xl font-semibold mb-6">My Enrollments</h1>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full table-auto border border-gray-300 rounded-lg overflow-hidden">
            <thead className="text-gray-900 bg-gray-100 text-sm md:text-base">
              <tr className="border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold">Course</th>
                <th className="px-4 py-3 text-left font-semibold max-sm:hidden">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-semibold max-sm:hidden">
                  Course Progress
                </th>
                <th className="px-4 py-3 text-left font-semibold max-sm:hidden">
                  Quiz Progress
                </th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="text-gray-700 divide-y divide-gray-300">
              {enrolledCourses.map((course, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  {/* Course Column */}
                  <td className="flex items-center space-x-4 px-4 py-4">
                    <img
                      src={course.courseThumbnail}
                      alt="Course Thumbnail"
                      className="w-14 sm:w-20 md:w-24 h-auto rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium md:text-base text-sm">
                        {course.courseTitle}
                      </p>
                      <div className="h-2 bg-gray-300 rounded-full w-full mt-1 relative">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{
                            width: progressArray[index]
                              ? `${(progressArray[index].lectureCompleted *
                                  100) /
                                  progressArray[index].totalLectures}%`
                              : "0%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Duration Column */}
                  <td className="px-4 py-4 max-sm:hidden text-sm text-gray-600">
                    {calculateCourseDuration(course)}
                  </td>

                  {/* Course Progress Column */}
                  <td className="px-4 py-4 max-sm:hidden text-sm text-gray-600">
                    {progressArray[index] && (
                      <span>
                        {progressArray[index].lectureCompleted} /{" "}
                        {progressArray[index].totalLectures} Lectures
                      </span>
                    )}
                  </td>

                  {/* Quiz Progress Column */}
                  <td className="px-4 py-4 max-sm:hidden text-sm text-gray-600">
                    {quizProgressArray[index] && quizProgressArray[index].hasQuizzes ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span>
                            {quizProgressArray[index].completedQuizzes} /{" "}
                            {quizProgressArray[index].totalQuizzes} Quizzes
                          </span>
                        </div>
                        <div className="h-2 bg-gray-300 rounded-full w-full relative">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{
                              width: `${(quizProgressArray[index].completedQuizzes /
                                quizProgressArray[index].totalQuizzes) *
                                100}%`,
                            }}
                          ></div>
                        </div>
                        {quizProgressArray[index].completedQuizzes > 0 && (
                          <div className="text-xs text-green-600">
                            Avg: {quizProgressArray[index].averageScore.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No quizzes</span>
                    )}
                  </td>

                  {/* Status Button Column */}
                  <td className="px-4 py-4 text-center">
                    <div className="space-y-2">
                      <button
                        className={`px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-medium rounded-lg shadow-md transition 
                  ${
                    progressArray[index] &&
                    progressArray[index].lectureCompleted /
                      progressArray[index].totalLectures ===
                      1
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                        onClick={() => navigate("/player/" + course._id)}
                      >
                        {progressArray[index] &&
                          (progressArray[index].lectureCompleted /
                            progressArray[index].totalLectures ===
                          1
                            ? "Completed"
                            : "Continue")}
                      </button>
                      
                      {/* Quiz Button - Only show if course has quizzes */}
                      {quizProgressArray[index] && quizProgressArray[index].hasQuizzes && (
                        <button
                          className="w-full px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-medium rounded-lg shadow-md transition bg-purple-600 hover:bg-purple-700"
                          onClick={() => navigate(`/course/${course._id}/quizzes`)}
                        >
                          {quizProgressArray[index].completedQuizzes > 0
                            ? "View Quizzes"
                            : "Take Quizzes"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollments;
