// src/pages/AboutLMS.jsx

import React from "react";

const AboutLMS = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">About Our LMS</h1>
      <p className="text-gray-600 mb-3">
        Our Learning Management System (LMS) provides a modern, flexible platform to help students and educators achieve their goals.
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mt-6">Key Features:</h2>
      <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
        <li>Course creation and management</li>
        <li>Student enrollment and progress tracking</li>
        <li>Integrated payments and certification</li>
        <li>Role-based privileges (admin, educator, student)</li>
        <li>Real-time chat assistant for support</li>
        <li>Responsive design for all devices</li>
      </ul>

      <p className="text-gray-600 mt-6">
        Built with ❤️ by Elsafwa Team – We Can and We Will. Led by Mahmod Elsherif.
      </p>
    </div>
  );
};

export default AboutLMS;
