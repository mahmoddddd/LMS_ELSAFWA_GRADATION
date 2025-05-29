import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white w-full mt-10">
    <div className="container mx-auto px-6 lg:px-20 py-10 border-b border-white/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
        
        {/* Logo & Description */}
        <div className="flex flex-col items-center md:items-start">
          <img src={assets.logo} alt="logo" className="w-16 h-16"/>
          <p className="mt-4 text-center md:text-left text-sm text-white/80">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            <br/>Lorem Ipsum has been the industry's standard dummy text.
          </p>
        </div>
  
        {/* Company Links */}
        <div className="flex flex-col items-center md:items-start">
          <h2 className="font-semibold text-white mb-4">Company</h2>
          <ul className=" space-y-2 text-sm text-white/80 text-start">
            <li><a href="#" className="hover:text-white transition">Home</a></li>
            <li><a href="/about" className="hover:text-white transition">About Us</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
            <li><a href="/policy" className="hover:text-white transition">Privacy Policy</a></li>
          </ul>
        </div>
  
        {/* Newsletter Subscription */}
        <div className="flex flex-col items-center md:items-start">
          <h2 className="font-semibold text-white mb-4">Subscribe to our newsletter</h2>
          <p className="text-sm text-white/80 text-center md:text-left">
            Get the latest news, articles, and resources, sent to your inbox weekly.
          </p>
          <div className="flex items-center gap-2 pt-4 w-full">
            <input 
              className="border border-gray-600 bg-gray-700 text-white placeholder-gray-400 outline-none w-full md:w-64 h-9 rounded px-3 text-sm" 
              type="email" 
              placeholder="Enter your email"
            />
            <button className="bg-blue-600 hover:bg-blue-700 transition w-24 h-9 text-white rounded">
              Subscribe
            </button>
          </div>
        </div>
  
      </div>
    </div>
  
    {/* Copyright Section */}
    <p className="py-4 text-center text-xs md:text-sm text-white/80">
      Copyright 2025 © PLA academy. All Rights Reserved.
    </p>
  </footer>
  
  );
};

export default Footer;
