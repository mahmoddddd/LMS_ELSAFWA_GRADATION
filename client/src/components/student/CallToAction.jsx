import React from "react";
import { assets } from "../../assets/assets";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const CallToAction = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/course-list");
  };

  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-24 px-4 sm:px-6 md:px-0 text-center">
      <h1 className="text-xl sm:text-2xl md:text-4xl text-gray-800 font-semibold leading-snug">
        Learn anything, anytime, anywhere
      </h1>

      <p className="text-gray-500 text-sm sm:text-base max-w-xl">
        Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id
        veniam aliqua proident excepteur commodo do ea.
      </p>
      <p className="text-gray-500 text-sm sm:text-base max-w-xl">
        With us Elsafwa Team — We Can And We Will. Created by Mahmoud Elsherif
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center font-medium gap-4 mt-4">
        <button
          className="w-full sm:w-auto px-8 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
          onClick={handleGetStarted}
        >
          Get Started
        </button>
        <button
          className="flex items-center justify-center gap-2 text-blue-600 hover:underline"
          onClick={() => navigate("/about-lms")}
        >
          Learn More{" "}
          <img src={assets.arrow_icon} alt="arrow_icon" className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default CallToAction;
