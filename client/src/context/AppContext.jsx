import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from "react-toastify";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch all courses properly
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch UserData
  const fetchUserData = async () => {
    if (user.publicMetadata.role === 'educator') {
      setIsEducator(true);
    }
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Call fetchAllCourses inside useEffect
  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

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
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to calculate the number of lectures in a course
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      totalLectures += chapter.chapterContent.length;
    });
    return totalLectures;
  };

  // Function to calculate the total duration of a course
  const calculateCourseDuration = (course) => {
    let totalDuration = 0;
    course.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        totalDuration += lecture.lectureDuration;
      });
    });
    return humanizeDuration(totalDuration * 60 * 1000, { units: ["h", "m"] });
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
    calculateChapterTime
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
//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