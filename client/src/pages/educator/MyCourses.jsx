import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const {
    userData,
    backendUrl,
    getToken,
    fetchEducatorCourses,
    educatorCourses,
    isEducator,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        if (userData && isEducator) {
          await fetchEducatorCourses();
        } else if (!isEducator) {
          navigate("/");
          toast.error("You must be an educator to access this page");
        }
      } catch (error) {
        console.error("Error loading courses:", error);
        toast.error("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [userData, isEducator, fetchEducatorCourses, navigate]);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${backendUrl}/api/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success("Course deleted successfully");
        await fetchEducatorCourses();
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  const handleUpdateCourse = (courseId) => {
    navigate(`/educator/update-course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">My Courses</h1>
        <button
          onClick={() => navigate("/educator/add-course")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Course
        </button>
      </div>

      {!educatorCourses || educatorCourses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            You haven&apos;t created any courses yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {educatorCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={course.courseThumbnail}
                alt={course.courseTitle}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {course.courseTitle}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {course.courseDescription.length > 100
                    ? course.courseDescription.slice(0, 100) + "..."
                    : course.courseDescription}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">
                    ${course.coursePrice}
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleUpdateCourse(course._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
