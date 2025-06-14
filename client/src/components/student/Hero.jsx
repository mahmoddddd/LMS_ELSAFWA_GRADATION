import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="flex flex-col items-center justify-center w-full pt-20 md:pt-36 px-4 space-y-7 text-center">
      {/* Heading with animation */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-3xl md:text-5xl font-bold text-gray-800 max-w-3xl mx-auto leading-snug"
      >
        Empower your future with the courses designed to{" "}
        <span className="text-blue-600 relative inline-block">
          fit your choice.
          <img
            src={assets.sketch}
            alt="underline sketch"
            className="md:block hidden absolute -bottom-7 right-0"
          />
        </span>
      </motion.h1>

      {/* Paragraph with animation */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        className="hidden md:block text-gray-500 max-w-2xl mx-auto text-base"
      >
        We bring together world-class instructors, interactive content, and a
        supportive community to help you achieve your personal and professional
        goals.
      </motion.p>

      {/* Search input */}
      <SearchBar />
    </section>
  );
};

export default Hero;
