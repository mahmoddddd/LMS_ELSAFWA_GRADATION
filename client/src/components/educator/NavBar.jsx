import React from "react";
import { assets, dummyEducatorData } from "../../assets/assets";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const NavBar = () => {
  const educatorData = dummyEducatorData;
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 border-b-2 shadow-md py-3 bg-white">
      {/* Logo */}
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="w-14 sm:w-16 lg:w-20" />
      </Link>

      {/* Right Side */}
      <div className="flex items-center gap-3 sm:gap-5 text-gray-600 text-sm sm:text-base">
        <p className="hidden xs:block truncate max-w-[100px] sm:max-w-none">
          Hi! {user ? user.fullName : "Developers"}
        </p>

        {user ? (
          <div className="w-8 h-8">
            <UserButton />
          </div>
        ) : (
          <img
            className="w-8 h-8 rounded-full object-cover"
            src={assets.profile_img}
            alt="profile"
          />
        )}
      </div>
    </div>
  );
};

export default NavBar;
