import React, { useContext, useEffect, useState } from 'react';
import Loading from '../../components/student/Loading';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const StudentEnrolled = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext);
  const [enrolledStudents, setEnrolledStudents] = useState(null);

  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/enrolled-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
     
      if (data.success) {
        setEnrolledStudents(data.enrolledStudents.length > 0 ? data.enrolledStudents.reverse() : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents();
    }
  }, [isEducator]);

  return enrolledStudents ? (
    <div className="h-screen flex flex-col items-start justify-between md:p-8 p-4 pt-8">
  <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-300 shadow-md">
    <table className="w-full table-auto">
      {/* Table Header */}
      <thead className="text-gray-900 bg-gray-100 text-sm border-b border-gray-300">
        <tr>
          <th className="px-4 py-3 font-semibold text-center w-12">#</th>
          <th className="px-4 py-3 font-semibold text-left">Student Name</th>
          <th className="px-4 py-3 font-semibold text-left">Course Title</th>
          <th className="px-4 py-3 font-semibold text-right">Date</th>
        </tr>
      </thead>

      {/* Table Body */}
      <tbody className="text-sm text-gray-700">
        {enrolledStudents.length > 0 ? (
          enrolledStudents.map((item, index) => (
            <tr key={index} className="border-b border-gray-200 even:bg-gray-50">
              {/* Index Number */}
              <td className="px-4 py-3 text-center text-gray-600 font-medium">{index + 1}</td>

              {/* Student Info */}
              <td className="px-4 py-3 flex items-center gap-3">
                <img
                  src={item.student.imageUrl}
                  alt="profile"
                  className="w-10 h-10 rounded-full shadow-md"
                />
                <span className="truncate font-medium text-gray-800">
                  {item.student.name}
                </span>
              </td>

              {/* Course Title */}
              <td className="px-4 py-3 truncate text-gray-600">{item.courseTitle}</td>

              {/* Purchase Date */}
              <td className="px-4 py-3 text-right text-gray-600">
                {new Date(item.purchaseDate).toLocaleDateString()}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
              No enrolled students found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

  ) : <Loading />;
};

export default StudentEnrolled;
