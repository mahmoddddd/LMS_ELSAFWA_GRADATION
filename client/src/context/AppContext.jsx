// import { createContext, useEffect, useState } from "react";
// import { dummyCourses } from "../assets/assets";
// import { useNavigate } from "react-router-dom";
// import { useAuth, useUser } from "@clerk/clerk-react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import humanizeDuration from "humanize-duration";

// export const AppContext = createContext();

// const backendUrl = import.meta.env.VITE_BACKEND_URL;

// export const AppContextProvider = ({ children }) => {
//   const currency = import.meta.env.VITE_CURRENCY;
//   const navigate = useNavigate();

//   const { getToken } = useAuth();
//   const { user } = useUser();

//   const [allCourses, setAllCourses] = useState([]);
//   const [isEducator, setIsEducator] = useState(false);
//   const [enrolledCourses, setEnrolledCourses] = useState([]);
//   const [userData, setUserData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Fetch all courses properly
//   const fetchAllCourses = async () => {
//     try {
//       setIsLoading(true);
//       const { data } = await axios.get(`${backendUrl}/api/course/all`);
//       if (data.success) {
//         setAllCourses(data.courses);
//       } else {
//         toast.error(data.message || "Failed to fetch courses");
//       }
//     } catch (error) {
//       console.error("Error fetching courses:", error);
//       toast.error("Failed to load courses. Please try again later.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch UserData
//   const fetchUserData = async () => {
//     if (!user) return;

//     try {
//       const token = await getToken();
//       const { data } = await axios.get(`${backendUrl}/api/user/data`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (data.success) {
//         setUserData(data.user);
//         if (data.user.role === "educator") {
//           setIsEducator(true);
//         }
//       } else {
//         toast.error(data.message || "Failed to fetch user data");
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       toast.error("Failed to load user data. Please try again later.");
//     }
//   };

//   // Call fetchAllCourses inside useEffect
//   useEffect(() => {
//     fetchAllCourses();
//   }, []);

//   useEffect(() => {
//     if (user?.id) {
//       fetchUserData();
//       fetchUserEnrolledCourses();
//     }
//   }, [user?.id]);

//   // Function to calculate average rating of a course
//   const calculateRating = (course) => {
//     if (course.courseRatings.length === 0) {
//       return 0;
//     }
//     let totalRating = 0;
//     course.courseRatings.forEach((rating) => {
//       totalRating += rating.rating;
//     });
//     return Math.floor(totalRating / course.courseRatings.length);
//   };

//   // Fetch user enrolled courses
//   const fetchUserEnrolledCourses = async () => {
//     try {
//       const token = await getToken();
//       const { data } = await axios.get(
//         `${backendUrl}/api/user/enrolled-courses`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (data.success) {
//         setEnrolledCourses(data.enrolledCourses.reverse());
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   // Function to calculate the number of lectures in a course
//   const calculateNoOfLectures = (course) => {
//     let totalLectures = 0;
//     course.courseContent.forEach((chapter) => {
//       totalLectures += chapter.chapterContent.length;
//     });
//     return totalLectures;
//   };

//   // Function to calculate the total duration of a course
//   const calculateCourseDuration = (course) => {
//     if (!course?.courseContent) return "0h 0m";
//     let totalDuration = 0;
//     course.courseContent.forEach((chapter) => {
//       chapter.chapterContent.forEach((lecture) => {
//         totalDuration += lecture.lectureDuration;
//       });
//     });
//     return humanizeDuration(totalDuration * 60 * 1000, { units: ["h", "m"] });
//   };

//   // Function to calculate the total duration of a chapter
//   const calculateChapterTime = (chapter) => {
//     let totalDuration = 0;
//     chapter.chapterContent.forEach((lecture) => {
//       totalDuration += lecture.lectureDuration;
//     });
//     return humanizeDuration(totalDuration * 60 * 1000, { units: ["h", "m"] });
//   };

//   const value = {
//     currency,
//     allCourses,
//     navigate,
//     calculateRating,
//     isEducator,
//     setIsEducator,
//     enrolledCourses,
//     fetchUserEnrolledCourses,
//     backendUrl,
//     userData,
//     setUserData,
//     getToken,
//     fetchAllCourses,
//     calculateNoOfLectures,
//     calculateCourseDuration,
//     calculateChapterTime,
//     isLoading,
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// };
// //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
import { createContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Function to check user role from multiple sources
  const checkUserRole = useCallback(async () => {
    if (!user?.id) return false;

    try {
      // 1. أول حاجة نشوف الـ Clerk public metadata
      const clerkRole = user.publicMetadata?.role;
      console.log("🔍 Clerk role from metadata:", clerkRole);

      // 2. لو مالقيناش في Clerk، نجيب من الداتابيز
      if (!clerkRole || clerkRole === "student") {
        const token = await getToken();
        const { data } = await axios.get(`${backendUrl}/api/user/data`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success && data.user) {
          const dbRole = data.user.role;
          console.log("🗄️ Database role:", dbRole);

          // لو الرول في الداتابيز educator بس مش في Clerk، نحدث Clerk
          if (dbRole === "educator" && clerkRole !== "educator") {
            console.log("🔄 Syncing Clerk metadata with database...");
            // هنا ممكن نعمل API call لتحديث Clerk metadata
            await syncClerkRole(dbRole);
          }

          return dbRole === "educator";
        }
      }

      return clerkRole === "educator";
    } catch (error) {
      console.error("❌ Error checking user role:", error);
      return false;
    }
  }, [user, getToken]);

  // ✅ Function to sync Clerk metadata with database
  const syncClerkRole = async (role) => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/user/sync-role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Clerk role synced successfully");
    } catch (error) {
      console.error("❌ Error syncing Clerk role:", error);
    }
  };

  // Fetch all courses
  const fetchAllCourses = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Improved fetchUserData with role checking
  const fetchUserData = async () => {
    if (!user) return;

    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);

        // ✅ تحديث الـ isEducator state بناءً على الداتا من الداتابيز
        const userRole = data.user.role;
        console.log("👤 User role from database:", userRole);

        if (userRole === "educator") {
          setIsEducator(true);
          console.log("🎓 User is educator - updating state");
        } else {
          setIsEducator(false);
          console.log("👨‍🎓 User is student");
        }

        // ✅ تأكد إن Clerk metadata متزامن مع الداتابيز
        const clerkRole = user.publicMetadata?.role;
        if (userRole !== clerkRole) {
          console.log("🔄 Role mismatch - syncing Clerk metadata");
          await syncClerkRole(userRole);
        }
      } else {
        toast.error(data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data. Please try again later.");
    }
  };

  // ✅ useEffect لتحديث الرول لما المستخدم يسجل دخول أو يتغير
  useEffect(() => {
    const initializeUserRole = async () => {
      if (user?.id) {
        console.log("🚀 Initializing user role for:", user.id);

        // تحقق من الرول في Clerk أولاً
        const clerkRole = user.publicMetadata?.role;
        console.log("🔍 Initial Clerk role:", clerkRole);

        if (clerkRole === "educator") {
          setIsEducator(true);
          console.log("✅ Set educator from Clerk metadata");
        }

        // جيب باقي بيانات المستخدم
        await fetchUserData();
        await fetchUserEnrolledCourses();
      } else {
        // لو مافيش user، reset everything
        setIsEducator(false);
        setUserData(null);
        setEnrolledCourses([]);
      }
    };

    initializeUserRole();
  }, [user?.id, user?.publicMetadata?.role]); // ✅ متابعة تغيير الـ role في Clerk

  useEffect(() => {
    fetchAllCourses();
  }, []);

  // Function to calculate average rating of a course
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) {
      return 0;
    }
    let totalRating = 0;
    course.courseRatings.forEach((rating) => {
      totalRating += rating.rating;
    });
    return Math.floor(totalRating / course.courseRatings.length);
  };

  // Fetch user enrolled courses
  const fetchUserEnrolledCourses = async () => {
    if (!user?.id) return;

    try {
      const token = await getToken();
      console.log(token);
      const { data } = await axios.get(
        `${backendUrl}/api/user/enrolled-courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      toast.error("Failed to load enrolled courses");
    }
  };

  // Function to calculate the number of lectures in a course
  const calculateNoOfLectures = (course) => {
    if (!course?.courseContent) return 0;
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      totalLectures += chapter.chapterContent.length;
    });
    return totalLectures;
  };

  // Function to calculate the total duration of a course
  const calculateCourseDuration = (course) => {
    if (!course?.courseContent) return 0;
    let totalDuration = 0;
    course.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        totalDuration += lecture.lectureDuration;
      });
    });
    return totalDuration;
  };

  // Function to calculate the total duration of a chapter
  const calculateChapterTime = (chapter) => {
    let totalDuration = 0;
    chapter.chapterContent.forEach((lecture) => {
      totalDuration += lecture.lectureDuration;
    });
    return humanizeDuration(totalDuration * 60 * 1000, { units: ["h", "m"] });
  };

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducator,
    setIsEducator,
    enrolledCourses,
    fetchUserEnrolledCourses,
    backendUrl,
    userData,
    setUserData,
    getToken,
    fetchAllCourses,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    isLoading,
    checkUserRole, // ✅ إضافة function للتحقق من الرول
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
