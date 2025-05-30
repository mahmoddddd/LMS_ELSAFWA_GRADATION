import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import { v4 as uuidv4 } from "uuid";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";

const AddCourse = () => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const { backendUrl } = useContext(AppContext);
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureVideo: null,
    isPreviewFree: false,
  });

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) {
      return;
    }

    if (!user) {
      toast.error("Please sign in to add a course");
      return;
    }
  }, [isUserLoaded, isAuthLoaded, user]);

  useEffect(() => {
    // initiate quill only once
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter chapter name");
      if (title) {
        const newChapter = {
          chapterId: uuidv4(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(
        chapters.filter((chapter) => chapter.chapterId !== chapterId)
      );
    } else if (action === "toggle") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? { ...chapter, collapsed: !chapter.collapsed }
            : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = async () => {
    if (!lectureDetails.lectureVideo) {
      toast.error("Please upload a video for the lecture");
      return;
    }

    if (!lectureDetails.lectureTitle || !lectureDetails.lectureDuration) {
      toast.error("Please fill in all lecture details");
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", lectureDetails.lectureVideo);

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/educator/upload-lecture-video`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        setChapters(
          chapters.map((chapter) => {
            if (chapter.chapterId === currentChapterId) {
              const newLecture = {
                lectureTitle: lectureDetails.lectureTitle,
                lectureDuration: Number(lectureDetails.lectureDuration),
                lectureUrl: data.videoUrl,
                isPreviewFree: lectureDetails.isPreviewFree,
                lectureOrder:
                  chapter.chapterContent.length > 0
                    ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                    : 1,
                lectureId: uuidv4(),
              };
              chapter.chapterContent.push(newLecture);
            }
            return chapter;
          })
        );
        setShowPopup(false);
        setLectureDetails({
          lectureTitle: "",
          lectureDuration: "",
          lectureVideo: null,
          isPreviewFree: false,
        });
        toast.success("Lecture added successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isUserLoaded || !isAuthLoaded) {
      toast.error("Please wait while we load your account information");
      return;
    }

    if (!user) {
      toast.error("Please sign in to add a course");
      return;
    }

    if (!image) {
      toast.error("Please select a course thumbnail");
      return;
    }

    if (!courseTitle.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    if (chapters.length === 0) {
      toast.error("Please add at least one chapter");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const courseData = {
        courseTitle: courseTitle.trim(),
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
        educator: user.id,
      };

      console.log("Submitting course data:", courseData); // Debug log

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      formData.append("image", image);

      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        // Reset form
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        quillRef.current.root.innerHTML = "";
      } else {
        throw new Error(data.message || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(
        error.message || "Failed to create course. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-20 pt-10">
      {/* Form Section */}
      <div className="max-w-xl w-full text-gray-700 border border-gray-300 p-6 rounded-lg shadow-md bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Course Title */}
          <div>
            <label className="font-medium">Course Title</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Type here"
              className="w-full outline-none py-2 px-3 rounded border border-gray-400 mt-1"
              required
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="font-medium">Course Description</label>
            <div
              ref={editorRef}
              className="border border-gray-400 rounded p-2"
            ></div>
          </div>

          {/* Course Price & Thumbnail */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Course Price */}
            <div className="flex flex-col">
              <label className="font-medium">Course Price</label>
              <input
                type="number"
                value={coursePrice}
                onChange={(e) => setCoursePrice(e.target.value)}
                placeholder="0"
                className="outline-none py-2 px-3 rounded border border-gray-400 w-32"
                required
              />
            </div>

            {/* Course Thumbnail */}
            <div>
              <label className="font-medium">Course Thumbnail</label>
              <label
                htmlFor="thumbnailImage"
                className="flex items-center gap-3 cursor-pointer"
              >
                <img
                  src={assets.file_upload_icon}
                  alt="upload icon"
                  className="p-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                />
                <input
                  type="file"
                  id="thumbnailImage"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  hidden
                />
                {image && (
                  <img
                    className="h-10 rounded-md"
                    src={URL.createObjectURL(image)}
                    alt="Thumbnail preview"
                  />
                )}
              </label>
            </div>
          </div>

          {/* Discount Input */}
          <div>
            <div>
              <label className="font-medium">Discount %</label>
            </div>

            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              min={0}
              max={100}
              className="outline-none py-2 px-3 rounded border border-gray-400 w-28"
              required
            />
          </div>

          {/* Chapters Section */}
          <div>
            {chapters.map((chapter, chapterIndex) => (
              <div
                key={chapterIndex}
                className="bg-white border rounded-lg mb-4"
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center">
                    <img
                      onClick={() => handleChapter("toggle", chapter.chapterId)}
                      src={assets.dropdown_icon}
                      width={14}
                      alt="dropdown icon"
                      className={`mr-2 cursor-pointer transition-all ${chapter.collapsed &&
                        "-rotate-90"}`}
                    />
                    <span className="font-semibold">
                      {chapterIndex + 1}. {chapter.chapterTitle}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img
                    onClick={() => handleChapter("remove", chapter.chapterId)}
                    src={assets.cross_icon}
                    alt="cross icon"
                    className="cursor-pointer"
                  />
                </div>
                {!chapter.collapsed && (
                  <div className="p-4">
                    {chapter.chapterContent.map((lecture, lectureIndex) => (
                      <div
                        key={lectureIndex}
                        className="flex justify-between items-center mb-2"
                      >
                        <span>
                          {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
                          {lecture.lectureDuration} mins -{" "}
                          <a
                            href={lecture.lectureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            Video
                          </a>{" "}
                          - {lecture.isPreviewFree ? "Free preview" : "Paid"}
                        </span>
                        <img
                          src={assets.cross_icon}
                          alt="cross icon"
                          onClick={() =>
                            handleLecture(
                              "remove",
                              chapter.chapterId,
                              lectureIndex
                            )
                          }
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="bg-gray-100 p-2 rounded mt-2 hover:bg-gray-200 transition"
                      onClick={() => handleLecture("add", chapter.chapterId)}
                    >
                      + Add Lectures
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="w-full bg-blue-100 p-2 rounded-lg hover:bg-blue-200 transition"
              onClick={() => handleChapter("add")}
            >
              + Add Chapter
            </button>
          </div>

          {/* Popup Modal */}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="bg-white text-gray-700 p-5 rounded-lg shadow-lg w-full max-w-sm relative">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

                <div className="mb-2">
                  <label className="font-medium">Lecture Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureTitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="font-medium">Duration (minutes)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureDuration: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="font-medium">Lecture Video</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <img
                        src={assets.file_upload_icon}
                        alt="upload icon"
                        className="p-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                      />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          setLectureDetails({
                            ...lectureDetails,
                            lectureVideo: e.target.files[0],
                          })
                        }
                        hidden
                      />
                      {lectureDetails.lectureVideo && (
                        <span className="text-sm text-gray-600">
                          {lectureDetails.lectureVideo.name}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="mb-2 flex items-center">
                  <label className="font-medium mr-2">Is Preview Free?</label>
                  <input
                    type="checkbox"
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        isPreviewFree: e.target.checked,
                      })
                    }
                    className="scale-125"
                  />
                </div>

                <button
                  className="w-full bg-blue-400 text-white px-4 py-2 rounded disabled:bg-gray-400"
                  onClick={addLecture}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? "Uploading..." : "Add"}
                </button>

                <img
                  onClick={() => setShowPopup(false)}
                  src={assets.cross_icon}
                  alt="cross icon"
                  className="absolute top-4 right-4 w-5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            className="bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:bg-gray-400"
            disabled={isSubmitting || !user || !isUserLoaded || !isAuthLoaded}
          >
            {isSubmitting ? "Creating Course..." : "ADD"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
