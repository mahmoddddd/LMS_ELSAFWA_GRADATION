import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../../components/educator/NavBar";
import SideBar from "../../components/educator/SideBar";
import Footer from "../../components/educator/Footer";

const Educator = () => {
  return (
    <div className="text-default min-h-screen bg-white">
      <NavBar />
      <div className="flex">
        <SideBar />
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Educator;
