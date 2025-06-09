import React from 'react'

const PolicyPrivacy = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 md:px-20">
      <h1 className="text-3xl font-bold text-gray-800 text-center">Privacy Policy</h1>
      <div className="max-w-3xl mx-auto mt-6 bg-white p-6 shadow-lg rounded-lg">
        <p className="text-gray-600">
          At ELSAFWA TEAM , we value your privacy and strive to protect your personal data.
          This Privacy Policy outlines how we collect, use, and safeguard your information.
        </p>
        <h2 className="text-xl font-semibold mt-4">Information Collection</h2>
        <p className="text-gray-600">
          We collect user information such as name, email, and usage data to enhance your learning experience.
        </p>
        <h2 className="text-xl font-semibold mt-4">How We Use Your Data</h2>
        <p className="text-gray-600">
          - To provide personalized learning experiences.<br />
          - To improve platform features based on user feedback.<br />
          - To send important updates and notifications.
        </p>
        <h2 className="text-xl font-semibold mt-4">Data Security</h2>
        <p className="text-gray-600">
          We implement security measures to protect your information from unauthorized access.
        </p>
      </div>
    </div>
  )
}

export default PolicyPrivacy
