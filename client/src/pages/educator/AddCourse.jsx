import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import uniqid from "uniqid";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from 'axios';



const AddCourse = () => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const { backendUrl, getToken } = useContext(AppContext);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });

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
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
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

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                : 1,
            lectureId: uniqid(),
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
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!image) {
        toast.error("thumbnail not selected");
        return;
      }

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      };
      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      formData.append("image", image);

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        quillRef.current.root.innerHTML = "";
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
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
          <div ref={editorRef} className="border border-gray-400 rounded p-2"></div>
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
            <label htmlFor="thumbnailImage" className="flex items-center gap-3 cursor-pointer">
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
              {image && <img className="h-10 rounded-md" src={URL.createObjectURL(image)} alt="Thumbnail preview" />}
            </label>
          </div>
        </div>
  
        {/* Discount Input */}
        <div>
        <div><label className="font-medium">Discount %</label></div>
          
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
            <div key={chapterIndex} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                    src={assets.dropdown_icon}
                    width={14}
                    alt="dropdown icon"
                    className={`mr-2 cursor-pointer transition-all ${chapter.collapsed && "-rotate-90"}`}
                  />
                  <span className="font-semibold">
                    {chapterIndex + 1}. {chapter.chapterTitle}
                  </span>
                </div>
                <span className="text-gray-500">{chapter.chapterContent.length} Lectures</span>
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
                    <div key={lectureIndex} className="flex justify-between items-center mb-2">
                      <span>
                        {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
                        {lecture.lectureDuration} mins -{" "}
                        <a href={lecture.lectureUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                          Link
                        </a>{" "}
                        - {lecture.isPreviewFree ? "Free preview" : "Paid"}
                      </span>
                      <img
                        src={assets.cross_icon}
                        alt="cross icon"
                        onClick={() => handleLecture("remove", chapter.chapterId, lectureIndex)}
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
                  onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                />
              </div>
  
              <div className="mb-2">
                <label className="font-medium">Duration (minutes)</label>
                <input
                  type="number"
                  className="mt-1 block w-full border rounded py-1 px-2"
                  value={lectureDetails.lectureDuration}
                  onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                />
              </div>
  
              <div className="mb-2">
                <label className="font-medium">Lecture URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-1 px-2"
                  value={lectureDetails.lectureUrl}
                  onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                />
              </div>
  
              <div className="mb-2 flex items-center">
                <label className="font-medium mr-2">Is Preview Free?</label>
                <input
                  type="checkbox"
                  checked={lectureDetails.isPreviewFree}
                  onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                  className="scale-125"
                />
              </div>
  
              <button className="w-full bg-blue-400 text-white px-4 py-2 rounded" onClick={addLecture}>
                Add
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
        <button className="bg-black text-white w-max py-2.5 px-8 rounded my-4">ADD</button>
      </form>
    </div>
  </div>
  
  );
};

export default AddCourse;
