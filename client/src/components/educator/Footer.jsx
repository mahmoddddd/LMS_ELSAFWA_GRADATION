import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="flex md:flex-row flex-col-reverse items-center justify-between text-left w-full px-4 sm:px-6 md:px-8 py-4 border-t gap-4">
      {/* Left Side */}
      <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-center md:text-left">
        <img
          className="hidden md:block w-16 sm:w-20"
          src={assets.logo}
          alt="logo"
        />
        <div className="hidden md:block h-6 w-px bg-gray-500/60"></div>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Created by Mahmoud Elsherif, Mohamed Elsherbiny & Yasser ELnakeb
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 md:gap-3 justify-center md:justify-end">
        <a href="#">
          <img
            className="w-5 sm:w-6"
            src={assets.facebook_icon}
            alt="facebook_icon"
          />
        </a>
        <a href="#">
          <img
            className="w-5 sm:w-6"
            src={assets.twitter_icon}
            alt="twitter_icon"
          />
        </a>
        <a href="#">
          <img
            className="w-5 sm:w-6"
            src={assets.instagram_icon}
            alt="instagram_icon"
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
