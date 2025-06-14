import React from "react";

const PolicyPrivacy = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 md:px-20">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
        Privacy Policy
      </h1>

      <div className="max-w-3xl mx-auto mt-6 bg-white p-4 sm:p-6 shadow-lg rounded-lg space-y-4">
        <p className="text-gray-600 text-sm sm:text-base">
          At ELSAFWA TEAM, we value your privacy and strive to protect your
          personal data. This Privacy Policy outlines how we collect, use, and
          safeguard your information.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Information Collection
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          We collect user information such as name, email, and usage data to
          enhance your learning experience.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          How We Use Your Data
        </h2>
        <ul className="text-gray-600 text-sm sm:text-base list-disc list-inside space-y-1">
          <li>To provide personalized learning experiences.</li>
          <li>To improve platform features based on user feedback.</li>
          <li>To send important updates and notifications.</li>
        </ul>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Data Security
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          We implement security measures to protect your information from
          unauthorized access.
        </p>
      </div>
    </div>
  );
};

export default PolicyPrivacy;
