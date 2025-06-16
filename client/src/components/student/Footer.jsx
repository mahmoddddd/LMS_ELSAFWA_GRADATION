import React, { useState } from "react";
import { assets } from "../../assets/assets";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "../../config";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Please enter your email address.", {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Subscribed successfully!", {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
        setEmail("");
      } else {
        toast.error(data.message || "Subscription failed!", {
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
    <footer className="bg-gray-800 text-white w-full mt-10">
      <div className="container mx-auto px-6 lg:px-20 py-10 border-b border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start">
            <img src={assets.logo} alt="logo" className="w-16 h-16" />
            <p className="mt-4 text-center md:text-left text-sm text-white/80">
              Unlock Your Potential Through Learning
              <br />
              Join us and gain:
              <br />
              <br />
              ✔ 1000+ career-boosting courses
              <br />
              <br />
              ✔ World-class instructors
              <br />
              <br />
              ✔ Learn anytime, anywhere
              <br />
              <br />
              ✔ Certified skills
              <br />
              <br />
              Start learning today - transform your future!
            </p>
          </div>

          {/* Company Links */}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-semibold text-white mb-4">Company</h2>
            <ul className="space-y-2 text-sm text-white/80 text-start">
              <li>
                <a href="/" className="hover:text-white transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/policy" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-semibold text-white mb-4">
              Subscribe to our newsletter
            </h2>
            <p className="text-sm text-white/80 text-center md:text-left">
              Get the latest news, articles, and resources, sent to your inbox
              weekly.
            </p>
            <div className="flex items-center gap-2 pt-4 w-full">
              <input
                className="border border-gray-600 bg-gray-700 text-white placeholder-gray-400 outline-none w-full md:w-64 h-9 rounded px-3 text-sm"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 transition w-24 h-9 text-white rounded disabled:opacity-50"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="py-4 text-center text-xs md:text-sm text-white/80">
        Copyright 2025 © ELSAFWA TEAM All Rights Reserved.
      </p>

      <ToastContainer />
    </footer>
  );
};

export default Footer;
