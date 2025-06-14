import React from "react";
import Companies from "../../../components/student/Companies";
import Hero from "../../../components/student/Hero";
import CourseSection from "../../../components/student/CourseSection";
import TestMonialSection from "../../../components/student/TestMonialSection";
import CallToAction from "../../../components/student/CallToAction";
import Footer from "../../../components/student/Footer";
import Chatbot from "../../../components/student/Chatbot";

const Home = () => {
  return (
    <div className="flex flex-col items-center space-y-7 text-center px-4 max-w-screen-lg mx-auto">
      <Hero />
      <Companies />
      <Chatbot />
      <CourseSection />
      <TestMonialSection />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Home;
