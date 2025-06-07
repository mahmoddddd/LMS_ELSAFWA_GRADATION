import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../../assets/assets';

const DashBoard = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const { currency } = useContext(AppContext);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      console.log(token);
      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    }
  }, [isEducator]);

  return dashboardData ? (
    <div className="flex md:flex-row flex-col gap-1 relative items-start justify-between md:px-10 px-2 md:pt-10 text-left">
      <div className='space-y-3'>
        <div className='flex flex-wrap gap-3 items-center'>
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-60 rounded-md'>
            <img src={assets.patients_icon} alt='patients_icon' />
            <div>
              <p className='text-sxl font-medium text-gray-500'>{dashboardData.enrolledStudentsData.length}</p>
              <p className='text-base text-gray-500'>Total Enrollments</p>
            </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md'>
            <img src={assets.appointments_icon} alt='appointments_icon' />
            <div>
              <p className='text-sxl font-medium text-gray-500'>{dashboardData.totalcourses}</p>
              <p className='text-base text-gray-500'>Total Courses</p>
            </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md'>
            <img src={assets.earning_icon} alt='earning_icon' />
            <div>
              <p className='text-sxl font-medium text-gray-500'>{currency}{dashboardData.totalEarnings}</p>
              <p className='text-base text-gray-500'>Total Earnings</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto">
  <h2 className="pb-4 text-lg font-medium text-gray-900">Latest Enrollments</h2>

  <div className="overflow-hidden rounded-md bg-white border border-gray-300 shadow-md">
    <table className="w-full table-auto">
      <thead className="text-gray-900 bg-gray-100 text-sm border-b border-gray-300">
        <tr>
          <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
          <th className="px-4 py-3 font-semibold text-left">Student Name</th>
          <th className="px-4 py-3 font-semibold text-left">Course Title</th>
        </tr>
      </thead>

      <tbody className="text-sm text-gray-700">
        {dashboardData.enrolledStudentsData.map((item, index) => (
          <tr key={index} className="border-b border-gray-200 even:bg-gray-50">
            {/* Index Column (Hidden on Mobile) */}
            <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600">{index + 1}</td>

            {/* Student Info */}
            <td className="px-4 py-3 flex items-center gap-3">
              <img src={item.student.imageUrl} alt="profile" className="w-9 h-9 rounded-full shadow" />
              <span className="truncate font-medium text-gray-800">{item.student.name}</span>
            </td>

            {/* Course Title */}
            <td className="px-4 py-3 truncate text-gray-600">{item.courseTitle}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      </div>
      
    </div>
  ) : <Loading />;
};

export default DashBoard;
