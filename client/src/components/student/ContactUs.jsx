import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, message } = formData;

    if (!name || !email || !message) {
      toast.error("Please fill in all fields.", {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setLoading(true);
    const BACKEND_URL = "https://lms-backend-omega-two.vercel.app";

    try {
      const res = await fetch(`${BACKEND_URL}/api/cont/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Message sent successfully!", {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(data.message || "Failed to send message.", {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
      }
    } catch (error) {
      toast.error("Network error! Please try again.", {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 md:px-20">
      <h1 className="text-3xl font-bold text-gray-800 text-center">
        Contact Us
      </h1>
      <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto">
        Have any questions or need support? Get in touch with us using the form
        below.
      </p>
      <div className="max-w-2xl mx-auto bg-white shadow-lg p-6 rounded-lg mt-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Your Name"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Your Email"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              rows="4"
              placeholder="Your Message"
              disabled={loading}
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ContactUs;
