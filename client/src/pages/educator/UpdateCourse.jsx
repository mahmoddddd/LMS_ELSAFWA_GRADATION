import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const UpdateCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, getToken } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    courseTitle: "",
    courseDescription: "",
    coursePrice: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(
          `${backendUrl}/api/course/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success) {
          setFormData({
            courseTitle: data.courseData.courseTitle,
            courseDescription: data.courseData.courseDescription,
            coursePrice: data.courseData.coursePrice,
          });
          setCurrentThumbnail(data.courseData.courseThumbnail);
        } else {
          toast.error(data.message || "Failed to fetch course details");
          navigate("/educator/my-courses");
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to fetch course details");
        navigate("/educator/my-courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, backendUrl, getToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("courseData", JSON.stringify(formData));

      // Add files if they exist
      if (thumbnailFile) {
        formDataToSend.append("thumbnail", thumbnailFile);
      }
      if (videoFile) {
        formDataToSend.append("video", videoFile);
      }

      const { data } = await axios.put(
        `${backendUrl}/api/course/${courseId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success("Course updated successfully");
        navigate("/educator/my-courses");
      } else {
        toast.error(data.message || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error(error.response?.data?.message || "Failed to update course");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Update Course</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Course Title
          </label>
          <input
            type="text"
            name="courseTitle"
            value={formData.courseTitle}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Course Description
          </label>
          <textarea
            name="courseDescription"
            value={formData.courseDescription}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Course Price
          </label>
          <input
            type="number"
            name="coursePrice"
            value={formData.coursePrice}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Course Thumbnail
          </label>
          {currentThumbnail && (
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-2">Current Thumbnail:</p>
              <img
                src={currentThumbnail}
                alt="Current thumbnail"
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave empty to keep current thumbnail
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Course Video
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave empty to keep current video
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/educator/my-courses")}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Course
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateCourse;
