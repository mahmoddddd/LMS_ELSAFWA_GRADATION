import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";
import QuizIcon from "@mui/icons-material/Quiz";

const SideBar = () => {
  const { isEducator } = useContext(AppContext);

  const menuItems = [
    { name: "Dashboard", path: "/educator", icon: assets.home_icon },
    { name: "Add Course", path: "/educator/add-course", icon: assets.add_icon },
    {
      name: "My Courses",
      path: "/educator/my-courses",
      icon: assets.my_course_icon,
    },
    {
      name: "Students Enrolled",
      path: "/educator/student-enrolled",
      icon: assets.person_tick_icon,
    },
    { name: "Quizzes", path: "/educator/quizzes", icon: <QuizIcon /> },
    { name: "Add Quiz", path: "/educator/add-quiz", icon: <QuizIcon /> },
  ];

  return (
    isEducator && (
      <div
        className="
          w-full md:w-64 
          border-gray-300 
          border-t md:border-t-0 md:border-r 
          min-h-[60px] md:min-h-screen 
          py-2 md:py-4 
          flex flex-row md:flex-col 
          bg-white 
          transition-all duration-300
          "
      >
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            end={item.path === "/educator"}
            className={({ isActive }) =>
              `flex items-center 
               md:flex-row flex-col 
               md:justify-start justify-center 
               py-2 px-4 md:py-3.5 md:px-6 
               gap-1 md:gap-3
               text-gray-600 text-xs md:text-base
               ${
                 isActive
                   ? "bg-indigo-50 border-b-4 border-indigo-500 font-medium md:border-b-0 md:border-r-4"
                   : "hover:bg-gray-100 border-b-4 border-transparent hover:border-gray-300 md:border-b-0 md:border-r-4"
               }
               `
            }
          >
            {typeof item.icon === "string" ? (
              <img src={item.icon} alt="" className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <div className="w-5 h-5 md:w-6 md:h-6">{item.icon}</div>
            )}
            <p className="hidden md:block truncate">{item.name}</p>
          </NavLink>
        ))}
      </div>
    )
  );
};

export default SideBar;
