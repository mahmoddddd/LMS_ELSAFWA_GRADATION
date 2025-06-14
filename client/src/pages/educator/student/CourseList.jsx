import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/AppContext";
import SearchBar from "../../../components/student/SearchBar";
import { useParams } from "react-router-dom";
import CourseCart from "../../../components/student/CourseCart";
import { assets } from "../../../assets/assets";
import Footer from "../../../components/student/Footer";
import NavigationButtons from "../../../components/NavigationButtons";

const CourseList = () => {
  const { navigate, allCourses } = useContext(AppContext);
  const { input } = useParams();
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      const tempCourses = allCourses.slice();

      input
        ? setFilteredCourses(
            tempCourses.filter((item) =>
              item.courseTitle.toLowerCase().includes(input.toLowerCase())
            )
          )
        : setFilteredCourses(tempCourses);
    }
  }, [allCourses, input]);

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left">
        <NavigationButtons
          backPath="/"
          backText="العودة للرئيسية"
          showHome={true}
        />

        <div className="flex md:flex-row flex-col justify-between items-center gap-6 items-start w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">
              Course List{" "}
            </h1>
            <p className="text-gray-500">
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Home
              </span>{" "}
              /<span>Course List</span>
            </p>
          </div>
          <SearchBar data={input} />
        </div>
        <div>
          {input && (
            <div className="inline-flex items-center gap-2 mt-8 text-gray-500 px-4 py-2 border">
              <p>{input}</p>
              <img
                src={assets.cross_icon}
                alt=""
                className="cursor-pointer"
                onClick={() => navigate("/course-list")}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-3 px-2 md:px-0">
          {filteredCourses.map((course, index) => (
            <CourseCart key={index} course={course} />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseList;
