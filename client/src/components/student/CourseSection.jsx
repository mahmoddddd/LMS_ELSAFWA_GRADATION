import { useContext } from "react";
import { Link } from "react-router-dom";
import CourseCart from "./CourseCart";
import { AppContext } from "../../context/AppContext";

const CourseSection = () => {
  const { allCourses, isLoading } = useContext(AppContext);

  const sectionTitle = (
    <>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
        Learn from the best
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-3 text-center md:text-left">
        Discover our top-rated courses across various categories. From coding
        and design to business and wellness, our courses are crafted to deliver
        results.
      </p>
    </>
  );

  if (isLoading) {
    return (
      <div className="py-16 px-4 md:px-20">
        {sectionTitle}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 my-10">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-40 sm:h-48 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!allCourses || allCourses.length === 0) {
    return (
      <div className="py-16 px-4 md:px-20 text-center">
        {sectionTitle}
        <p className="text-sm text-gray-500 mt-6">
          No courses available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 md:px-20">
      {sectionTitle}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 my-10">
        {allCourses.slice(0, 4).map((course) => (
          <CourseCart key={course._id} course={course} />
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          to="/course-list"
          onClick={() => window.scrollTo(0, 0)}
          className="text-sm sm:text-base text-gray-600 border border-gray-300 px-6 py-2 rounded hover:bg-gray-100 transition"
        >
          Show All Courses
        </Link>
      </div>
    </div>
  );
};

export default CourseSection;
