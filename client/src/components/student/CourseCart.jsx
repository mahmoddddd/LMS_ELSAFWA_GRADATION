import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

const CourseCart = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);

  return (
    <Link
      to={'/course/' + course._id}
      onClick={() => scrollTo(0, 0)}
      className="border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden bg-white"
    >
      <img className="w-full h-48 object-cover" src={course.courseThumbnail} alt={course.courseTitle} />
      
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{course.courseTitle}</h3>
        <p className="text-gray-600 text-sm">{course.educator.name}</p>

         {/* Centered Rating Section */}
         <div className="flex items-center justify-center space-x-2">
          <p className="text-sm font-medium text-gray-700">{calculateRating(course)}</p>
          <div className="flex space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <img 
                key={i} 
                src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank} 
                alt="star" 
                className="w-4 h-4"
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">(22)</p>
        </div>

        <p className="text-lg font-semibold text-indigo-600">
          {currency}{(course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

export default CourseCart;
