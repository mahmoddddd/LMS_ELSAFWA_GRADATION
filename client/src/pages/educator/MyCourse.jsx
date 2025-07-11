import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import NavigationButtons from "../../components/NavigationButtons";

const MyCourse = () => {
  const { currency, backendUrl, getToken, isEducator } = useContext(AppContext);
  const [courses, setCourses] = useState(null);
  const navigate = useNavigate();

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/educator/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses();
    }
  }, [isEducator]);

  const handleEditCourse = (courseId) => {
    navigate(`/educator/edit-course/${courseId}`);
  };

  return courses ? (
    <div className="h-screen flex flex-col items-start justify-between md:p-8 p-4 pt-8">
      <NavigationButtons />
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium text-gray-900">My Courses</h2>

        <div className="flex flex-col items-center max-w-6xl w-full overflow-hidden rounded-md bg-white border border-gray-300 shadow-md">
          <table className="w-full table-auto">
            <thead className="text-gray-900 bg-gray-100 text-sm border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold text-left">
                  All Courses
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Earnings
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Students
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Published On
                </th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-700">
              {courses.map((course) => (
                <tr
                  key={course._id}
                  className="border-b border-gray-200 even:bg-gray-50"
                >
                  {/* Course Info */}
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={course.courseThumbnail}
                      alt=""
                      className="w-12 h-12 rounded-md shadow"
                    />
                    <span className="truncate font-medium text-gray-800 hidden md:block">
                      {course.courseTitle}
                    </span>
                  </td>

                  {/* Earnings */}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {currency}
                    {Math.floor(
                      course.enrolledStudents.length *
                        (course.coursePrice -
                          (course.discount * course.coursePrice) / 100)
                    )}
                  </td>

                  {/* Student Count */}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {course.enrolledStudents.length}
                  </td>

                  {/* Published Date */}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEditCourse(course._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MyCourse;
