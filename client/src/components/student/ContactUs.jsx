import React from 'react'

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 md:px-20">
    <h1 className="text-3xl font-bold text-gray-800 text-center">Contact Us</h1>
    <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto">
      Have any questions or need support? Get in touch with us using the form below.
    </p>
    <div className="max-w-2xl mx-auto bg-white shadow-lg p-6 rounded-lg mt-6">
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Name</label>
          <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="Your Name"/>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Email</label>
          <input type="email" className="w-full p-2 border border-gray-300 rounded" placeholder="Your Email"/>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Message</label>
          <textarea className="w-full p-2 border border-gray-300 rounded" rows="4" placeholder="Your Message"></textarea>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Send Message
        </button>
      </form>
    </div>
  </div>
  )
}

export default ContactUs
