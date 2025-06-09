import React from "react";
import { assets } from "../../assets/assets";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const CallToAction = () => {
  const navigate = useNavigate();

  const notify = () => {
    toast.info("Please log in to enroll in courses.", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0">
      <h1 className="text-xl md:text-4xl text-gray-800 font-semibold">
        Learn anything, anytime, anywhere
      </h1>
      <p className="text-gray-500 sm:text-sm">
        Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id
        veniam aliqua proident excepteur commodo do ea.
      </p>
      <p className="text-gray-500 sm:text-sm">
        With us Elsafwa Team We Can And We Will Created By ... Mahmod Elsherif
      </p>
      <div className="flex flex-row items-center font-medium gap-6 mt-4">
        <button
          className="px-10 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
          onClick={notify}
        >
          Get Started
        </button>
        <button
          className="flex items-center pt-2 gap-2 text-blue-600 hover:underline"
          onClick={() => navigate("/about-lms")}
        >
          Learn More <img src={assets.arrow_icon} alt="arrow_icon" />
        </button>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default CallToAction;
