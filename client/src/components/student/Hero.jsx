import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-0 space-y-7 text-center">
      {/* Heading with Motion */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="md:text-home-heading-large text-home-heading-small relative font-bold text-gray-800 max-w-3xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-extrabold text-4xl md:text-6xl drop-shadow-lg"
          >
            EduTech
          </motion.span>{" "}
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          >
            Transform Your Skills,{" "}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
            className="text-blue-600 relative flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3"
          >
            <span className="whitespace-nowrap">Master Your Future with</span>
            <motion.a
              href="https://mahmoddddd.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg md:text-2xl px-3 md:px-4 py-1 md:py-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border-2 border-emerald-400 hover:shadow-xl cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              Mahmod Elsherif
            </motion.a>
            <motion.a
              href="https://wa.me/201002084496"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 text-white font-bold text-base md:text-lg px-2 md:px-3 py-1 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300 hover:bg-green-600 cursor-pointer"
              title="تواصل معي على الواتساب"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              💬
            </motion.a>
            <motion.a
              href="https://github.com/mahmoddddd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-gray-800 text-white font-bold text-base md:text-lg px-2 md:px-3 py-1 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300 hover:bg-gray-700 cursor-pointer"
              title="شاهد مشاريعي على GitHub"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </motion.a>
            <motion.img
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 1.2 }}
              src={assets.sketch}
              alt="sketch"
              className="md:block hidden absolute -bottom-7 right-0"
            />
          </motion.span>
        </motion.h1>
      </motion.div>

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
