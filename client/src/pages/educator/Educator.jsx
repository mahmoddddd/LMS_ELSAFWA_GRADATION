import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../../components/educator/NavBar";
import SideBar from "../../components/educator/SideBar";
import Footer from "../../components/educator/Footer";
const Educator = () => {
  return (
    <div className="text-default min-h-screen bg-white flex flex-col">
      <NavBar />

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar ثابت العرض في الديسكتوب، في الموبايل 100% عرض بس يمكن تقلله */}
        <div className="w-full md:w-64 max-w-full">
          <SideBar />
        </div>

        {/* محتوى الصفحة */}
        <div className="flex-1 p-4 overflow-auto">
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
