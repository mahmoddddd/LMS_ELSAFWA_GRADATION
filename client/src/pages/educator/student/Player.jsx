// import React, { useContext, useEffect, useState } from "react";
// import { AppContext } from "../../../context/AppContext";
// import { useParams } from "react-router-dom";
// import { assets } from "../../../assets/assets";
// import humanizeDuration from "humanize-duration";
// import YouTube from "react-youtube";
// import Footer from "../../../components/student/Footer";
// import Rating from "../../../components/student/Rating";
// import Loading from "../../../components/student/Loading";
// import { toast } from "react-toastify";
// import axios from "axios";

// const Player = () => {
//   const {
//     enrolledCourses,
//     calculateChapterTime,
//     backendUrl,
//     getToken,
//     userData,
//     fetchUserEnrolledCourses,
//   } = useContext(AppContext);
//   const { courseId } = useParams();
//   const [courseData, setCourseData] = useState(null);
//   const [openSection, setOpenSection] = useState({});
//   const [playerData, setPlayerData] = useState(null);
//   const [progressData, setProgressData] = useState(null);
//   const [initialRating, setInitialRating] = useState(null);

//   const getCourseData = () => {
//     if (!enrolledCourses || enrolledCourses.length === 0) {
//       return;
//     }
//     enrolledCourses.map((course) => {
//       if (course._id === courseId) {
//         setCourseData(course);
//         course.courseRatings.map((item) => {
//           if (item.userId === userData._id) {
//             setInitialRating(item.rating);
//           }
//         });
//       }
//     });
//   };
//   const toggleSection = (index) => {
//     setOpenSection((prev) => ({
//       ...prev,
//       [index]: !prev[index],
//     }));
//   };

//   useEffect(() => {
//     if (enrolledCourses.length > 0) {
//       getCourseData();
//       getCourseProgress(); // Fetch course progress after getting course data
//     }
//   }, [enrolledCourses]);

//   const markLectureAsCompleted = async (lectureId) => {
//     try {
//       const token = await getToken();
//       const { data } = await axios.post(
//         `${backendUrl}/api/user/update-course-progress`,
//         { courseId, lectureId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (data.success) {
//         toast.success(data.message);
//         getCourseProgress();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   const getCourseProgress = async () => {
//     try {
//       const token = await getToken();
//       const { data } = await axios.post(
//         backendUrl + "/api/user/get-course-progress",
//         { courseId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (data.success) {
//         setProgressData(data.progressData);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   const handleRate = async (rating) => {
//     try {
//       const token = await getToken();
//       const { data } = await axios.post(
//         `${backendUrl}/api/user/add-rating`,
//         { courseId, rating },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (data.success) {
//         toast.success(data.message);
//         fetchUserEnrolledCourses();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   useEffect(() => {
//     getCourseProgress();
//   }, []);

//   return courseData ? (
//     <>
//       <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
//   {/* Left Column - Course Structure */}
//   <div className="pt-8 text-gray-800">
//     <h2 className="text-xl font-semibold">Course Structure</h2>
//     <div className="pt-5 space-y-3">
//       {courseData?.courseContent?.map((chapter, index) => (
//         <div key={index} className="border border-gray-300 bg-white rounded-lg shadow-sm">
//           <div
//             className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-gray-100 rounded-lg transition"
//             onClick={() => toggleSection(index)}
//           >
//             <div className="flex items-center gap-3">
//               <img
//                 className={`w-4 h-4 transform transition-transform ${openSection[index] ? "rotate-180" : ""}`}
//                 src={assets.down_arrow_icon}
//                 alt="arrow_icon"
//               />
//               <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
//             </div>
//             <p className="text-sm text-gray-600">
//               {chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}
//             </p>
//           </div>

//           <div
//             className={`overflow-hidden transition-all duration-500 ${openSection[index] ? "max-h-96" : "max-h-0"}`}
//           >
//             <ul className="md:pl-8 pl-4 pr-4 py-2 text-gray-600 bg-gray-50 rounded-b-lg">
//               {chapter.chapterContent.map((lecture, i) => (
//                 <li key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white transition">
//                   <div className="flex items-center gap-3">
//                     <img
//                       src={progressData?.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon}
//                       alt="play_icon"
//                       className="w-4 h-4"
//                     />
//                     <p className="text-sm">{lecture.lectureTitle}</p>
//                   </div>
//                   <div className="text-sm">
//                     {lecture.lectureUrl && (
//                       <p
//                         onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
//                         className="text-blue-500 cursor-pointer hover:underline"
//                       >
//                         Watch
//                       </p>
//                     )}
//                     <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ["h", "m"] })}</p>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       ))}
//     </div>

//     {/* Rate this course section */}
//     <div className="flex items-center gap-3 py-5 mt-8">
//       <h1 className="text-lg font-bold">Rate this course</h1>
//       <Rating initialRating={initialRating} onRate={handleRate} />
//     </div>
//   </div>

//   {/* Right Column - Video Player / Thumbnail */}
//   <div className="md:mt-6">
//     {playerData?.lectureUrl ? (
//       <div className="transition-all duration-300 ease-in-out">
//         <YouTube videoId={playerData.lectureUrl.split("/").pop()} iframeClassName="w-full aspect-video rounded-lg shadow-md" />
//         <div className="flex justify-between items-center mt-2 px-2">
//           <p className="text-sm text-gray-700">{playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}</p>
//           <button
//             onClick={() => markLectureAsCompleted(playerData.lectureId)}
//             className="text-blue-600 font-medium hover:underline"
//           >
//             {progressData?.lectureCompleted.includes(playerData.lectureId) ? "Completed" : "Mark Complete"}
//           </button>
//         </div>
//       </div>
//     ) : (
//       <img src={courseData?.courseThumbnail || ""} alt="Course Thumbnail" className="w-3/5 mx-auto rounded-lg shadow-md transition-all duration-300 ease-in-out" />
//     )}
//   </div>
// </div>

//       <Footer />
//     </>
//   ) : (
//     <Loading />
//   );
// };

// export default Player;

import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../../components/student/Footer";
import Rating from "../../../components/student/Rating";
import Loading from "../../../components/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses,
  } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(null);

  const getCourseData = () => {
    if (!enrolledCourses || enrolledCourses.length === 0) {
      return;
    }
    enrolledCourses.forEach((course) => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings.forEach((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating);
          }
        });
      }
    });
  };

  const toggleSection = (index) => {
    setOpenSection((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
      getCourseProgress();
    }
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/get-course-progress",
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getCourseProgress();
  }, []);

  return courseData ? (
    <>
      <div className="p-4 sm:p-10 flex flex-col md:grid md:grid-cols-2 gap-10 md:px-36">
        {/* Left Column - Course Structure */}
        <div className="pt-8 text-gray-800 max-w-full md:max-w-none overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Course Structure</h2>
          <div className="space-y-3">
            {courseData?.courseContent?.map((chapter, index) => (
              <div
                key={index}
                className="border border-gray-300 bg-white rounded-lg shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-gray-100 rounded-lg transition"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      className={`w-4 h-4 transform transition-transform ${
                        openSection[index] ? "rotate-180" : ""
                      }`}
                      src={assets.down_arrow_icon}
                      alt="arrow_icon"
                    />
                    <p className="font-medium md:text-base text-sm">
                      {chapter.chapterTitle}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-nowrap">
                    {chapter.chapterContent.length} lectures -{" "}
                    {calculateChapterTime(chapter)}
                  </p>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openSection[index] ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <ul className="md:pl-8 pl-4 pr-4 py-2 text-gray-600 bg-gray-50 rounded-b-lg">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              progressData?.lectureCompleted.includes(
                                lecture.lectureId
                              )
                                ? assets.blue_tick_icon
                                : assets.play_icon
                            }
                            alt="play_icon"
                            className="w-4 h-4"
                          />
                          <p className="text-sm">{lecture.lectureTitle}</p>
                        </div>
                        <div className="text-sm whitespace-nowrap">
                          {lecture.lectureUrl && (
                            <p
                              onClick={() =>
                                setPlayerData({
                                  ...lecture,
                                  chapter: index + 1,
                                  lecture: i + 1,
                                })
                              }
                              className="text-blue-500 cursor-pointer hover:underline"
                            >
                              Watch
                            </p>
                          )}
                          <p>
                            {humanizeDuration(
                              lecture.lectureDuration * 60 * 1000,
                              { units: ["h", "m"] }
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Rate this course section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-5 mt-8">
            <h1 className="text-lg font-bold">Rate this course</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* Right Column - Video Player / Thumbnail */}
        <div className="md:mt-6 w-full max-w-full">
          {playerData?.lectureUrl ? (
            <div className="transition-all duration-300 ease-in-out">
              <video
                src={playerData.lectureUrl}
                controls
                className="w-full aspect-video rounded-lg shadow-md"
                preload="metadata"
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 px-2 gap-2">
                <p className="text-sm text-gray-700">
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </p>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className="text-blue-600 font-medium hover:underline whitespace-nowrap"
                >
                  {progressData?.lectureCompleted.includes(playerData.lectureId)
                    ? "Completed"
                    : "Mark Complete"}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={courseData?.courseThumbnail || ""}
              alt="Course Thumbnail"
              className="w-full max-w-md mx-auto rounded-lg shadow-md transition-all duration-300 ease-in-out"
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default Player;
