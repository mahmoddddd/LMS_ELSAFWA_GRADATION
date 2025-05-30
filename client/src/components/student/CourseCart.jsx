import React, { useContext } from "react";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { Link } from "react-router-dom";

const CourseCart = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);

  if (!course) {
    return null;
  }

  const educatorName = course.educator?.name || "Unknown Educator";
  const rating = calculateRating(course);
  const price =
    course.coursePrice - (course.discount * course.coursePrice) / 100;

  return (
    <Link
      to={"/course/" + course._id}
      onClick={() => window.scrollTo(0, 0)}
      className="border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden bg-white"
    >
      <img
        className="w-full h-48 object-cover"
        src={course.courseThumbnail || assets.defaultThumbnail}
        alt={course.courseTitle || "Course thumbnail"}
      />

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {course.courseTitle || "Untitled Course"}
        </h3>
        <p className="text-gray-600 text-sm">{educatorName}</p>

        {/* Centered Rating Section */}
        <div className="flex items-center justify-center space-x-2">
          <p className="text-sm font-medium text-gray-700">{rating}</p>
          <div className="flex space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(rating) ? assets.star : assets.star_blank}
                alt="star"
                className="w-4 h-4"
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            ({course.courseRatings?.length || 0})
          </p>
        </div>

        <p className="text-lg font-semibold text-indigo-600">
          {currency}
          {price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

export default CourseCart;
