import Course from "../models/Course.js";

// Get All Courses
export const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Course by Id
export const getCourseId = async (req, res) => {
  const { id } = req.params;
  try {
    const courseData = await Course.findById(id).populate({ path: "educator" });
    if (!courseData) {
      return res.json({ success: false, message: "Course not found" });
    }

    // Check if user is enrolled
    const userId = req.auth?.userId;
    const isEnrolled = userId && courseData.enrolledStudents.includes(userId);

    // Only remove lecture URLs for non-enrolled students
    if (!isEnrolled && courseData.courseContent) {
      courseData.courseContent.forEach((chapter) => {
        chapter.chapterContent.forEach((lecture) => {
          if (!lecture.isPreviewfree) {
            lecture.lectureUrl = "";
          }
        });
      });
    }

    res.json({ success: true, courseData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
