import React from "react";
import { assets } from "../../assets/assets";

function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 md:px-20">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
        ELSAFWA TEAM — WE CAN AND WE WILL
      </h1>

      <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto text-sm sm:text-base">
        ELSAFWA TEAM is a leading learning management system that helps students
        and educators connect in a digital environment. Our goal is to provide
        high-quality education through an intuitive and interactive platform.
      </p>

      {/* Image Section */}
      <div className="mt-8 flex justify-center">
        <img
          src={assets.AboutUs}
          alt="About ELSAFWA Team"
          className="w-3/4 sm:w-2/3 md:w-1/2 lg:w-1/3 h-auto rounded-lg shadow-md"
        />
      </div>

      {/* Mission & Vision */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 sm:p-6 bg-white shadow-lg rounded-lg border-l-4 border-blue-500">
          <h2 className="text-lg sm:text-xl font-semibold">Our Mission</h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Empowering learners with technology-driven education, ensuring
            accessibility for all.
          </p>
        </div>

        <div className="p-4 sm:p-6 bg-white shadow-lg rounded-lg border-l-4 border-blue-500">
          <h2 className="text-lg sm:text-xl font-semibold">Our Vision</h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            To be the most trusted online learning platform for students
            worldwide.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
