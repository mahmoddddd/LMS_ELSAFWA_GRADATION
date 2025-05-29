import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});

  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);

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
    enrolledCourses
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
// const findCourse = allCourses.find(
    //   (course) => String(course._id) === String(id)
    // );
    // setCourseData(findCourse);
  }

  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.warn("Login to Enroll");
      }

      if (isAlreadyEnrolled) {
        return toast.warn("Already Enrolled");
      }
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        const { session_url } = data;
        window.location.replace(session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourseData();
    fetchUserEnrolledCourses()
  }, [allCourses]);

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id));
        }
  }, [userData, courseData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      setIsAlreadyEnrolled(enrolledCourses.some(course => course._id === id));
    }
  }, [enrolledCourses]);

  const toggleSection = (index) => {
    setOpenSection((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return courseData ? (
    <>
     <div className="flex md:flex-row flex-col-reverse gap-6 relative items-start justify-between md:px-32 px-10 md:pt-20 text-left w-full">
  {/* Background Gradient */}
  

  {/* Left Column */}
  <div className="max-w-xl z-10 text-gray-500">
    <h1 className="md:text-3xl text-2xl font-semibold text-gray-800">
      {courseData.courseTitle}
    </h1>
    <p
  className="text-base md:text-lg text-gray-600"
  dangerouslySetInnerHTML={{ __html: courseData.courseDescription.slice(0, 200) }}
></p>


    {/* Ratings & Reviews */}
    <div className="flex items-center space-x-2 pt-3 pb-1 text-sm">
      <p>{calculateRating(courseData)}</p>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <img
            key={i}
            src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank}
            alt="star"
            className="w-4 h-4"
          />
        ))}
      </div>
      <p className="text-blue-500">{courseData.courseRatings.length} ratings</p>
      <p className="text-blue-500">{courseData.courseRatings.length} students</p>
    </div>

    <p className="text-sm">
      Course By{" "}
      <span className="text-blue-600 underline">{courseData.educator.name}</span>
    </p>

    {/* Course Structure */}
    <div className="pt-10 text-gray-800 w-full max-w-6xl mx-auto">
  <h2 className="text-3xl font-semibold">Course Structure</h2>
  <div className="pt-6 space-y-5">
    {courseData.courseContent?.map((chapter, index) => (
      <div key={index} className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-md">
        {/* Chapter Header */}
        <div
          className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-gray-100 transition"
          onClick={() => toggleSection(index)}
        >
          <div className="flex items-center gap-5">
            <img
              className={`w-6 h-6 transform transition-transform ${
                openSection[index] ? "rotate-180" : ""
              }`}
              src={assets.down_arrow_icon}
              alt="arrow_icon"
            />
            <p className="font-medium text-lg md:text-xl">{chapter.chapterTitle}</p>
          </div>
          <p className="text-md md:text-lg text-gray-600">
            {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
          </p>
        </div>

        {/* Chapter Content (Collapsible) */}
        <div className={`overflow-hidden transition-all duration-500 ${openSection[index] ? "max-h-[700px]" : "max-h-0"}`}>
          <ul className="list-none border-t border-gray-300 bg-gray-50">
            {chapter.chapterContent.map((lecture, i) => (
              <li key={i} className="flex items-center justify-between px-8 py-5 border-b border-gray-200 hover:bg-gray-100 transition">
                {/* Play Icon & Lecture Title */}
                <div className="flex items-center gap-5">
                  <img src={assets.play_icon} alt="play_icon" className="w-7 h-7" />
                  <p className="text-lg">{lecture.lectureTitle}</p>
                </div>
                {/* Preview & Duration */}
                <div className="text-md text-gray-600 flex gap-6">
                  {lecture.isPreviewFree && lecture.lectureUrl && (
                    <p
                      onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split("/").pop() })}
                      className="text-blue-500 cursor-pointer font-medium"
                    >
                      Preview
                    </p>
                  )}
                  <p>
                    {humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ["h", "m"] })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ))}
  </div>
</div>



    {/* Full Course Description */}
    <div className="py-20 text-sm md:text-base">
      <h3 className="text-xl font-semibold text-gray-800">Course Description</h3>
      <p className="pt-3" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}></p>
    </div>
  </div>

  {/* Right Column */}
  <div className="w-full md:w-1/2 max-w-lg z-10 shadow-lg rounded-lg overflow-hidden bg-white min-w-[360px] sm:min-w-[420px]">
    {/* Video or Thumbnail */}
    {playerData ? (
        <YouTube
            videoId={playerData.videoId}
            opts={{ playerVars: { autoplay: 1 } }}
            iframeClassName="w-full aspect-video"
        />
    ) : (
        <img src={courseData.courseThumbnail} alt="course_thumbnail" className="w-full h-60 object-cover" />
    )}

    {/* Course Details */}
    <div className="p-6">
        {/* Limited Time Offer */}
        <div className="flex items-center gap-2 text-red-500 text-sm">
            <img src={assets.time_left_clock_icon} alt="time_left_clock_icon" className="w-5" />
            <p>
                <span className="font-semibold">5</span> days left at this price!
            </p>
        </div>

        {/* Pricing Section */}
        <div className="flex items-center gap-3 pt-4">
            <p className="text-gray-900 md:text-4xl text-2xl font-bold">
                {currency}{" "}
                {(
                    courseData.coursePrice -
                    (courseData.discount * courseData.coursePrice) / 100
                ).toFixed(2)}
            </p>
            <p className="md:text-lg text-gray-500 line-through">
                {currency} {courseData.coursePrice}
            </p>
            <p className="md:text-lg text-green-500 font-medium">{courseData.discount}% off</p>
        </div>

        {/* Enroll Button */}
        <button
            onClick={enrollCourse}
            className="mt-6 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition duration-300 text-white font-semibold text-lg"
        >
            {isAlreadyEnrolled ? "Already Enrolled" : "Enroll Now"}
        </button>
    </div>
</div>

</div>

      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default CourseDetails;
