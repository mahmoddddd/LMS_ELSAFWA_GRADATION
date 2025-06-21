import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-0 space-y-7 text-center">
      {/* Heading with Motion */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="md:text-home-heading-large text-home-heading-small relative font-bold text-gray-800 max-w-3xl mx-auto"
      >
        EduTeach Empower your future with the courses designed to{" "}
        <span className="text-blue-600 relative">
          fit your choice.
          <img
            src={assets.sketch}
            alt="sketch"
            className="md:block hidden absolute -bottom-7 right-0"
          />
        </span>
      </motion.h1>

      {/* Paragraph with Motion */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        className="md:block hidden text-gray-500 max-w-2xl mx-auto"
      >
        We bring together world-class instructors, interactive content, and a
        supportive community to help you achieve your personal and professional
        goals.
      </motion.p>

      <SearchBar />
    </div>
  );
};

export default Hero;
