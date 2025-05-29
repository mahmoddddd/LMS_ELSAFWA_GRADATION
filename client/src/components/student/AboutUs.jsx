import React from 'react';


function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 md:px-20">
      <h1 className="text-3xl font-bold text-gray-800 text-center">About PLA Academy</h1>
      <p className="mt-4 text-gray-600 text-center max-w-3xl mx-auto">
        PLA Academy is a leading learning management system that helps students
        and educators connect in a digital environment. Our goal is to provide
        high-quality education through an intuitive and interactive platform.
      </p>

      {/* Image Section */}
      <div className="mt-8 flex justify-center">
        <img 
          src={assets.AboutUs} // Update this path to your actual image location
          alt="About PLA Academy"
           className="w-1/2 md:w-1/3 lg:w-1/4 h-auto rounded-lg shadow-md"/>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
      <div className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-blue-500">
  <h2 className="text-xl font-semibold">Our Mission</h2>
  <p className="text-gray-600 mt-2">
    Empowering learners with technology-driven education, ensuring accessibility for all.
  </p>
</div>

<div className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold">Our Vision</h2>
          <p className="text-gray-600 mt-2">
            To be the most trusted online learning platform for students worldwide.
          </p>
        </div>
      </div>
    </div>
  );
}
import { assets } from '../../assets/assets';

export default AboutUs;
