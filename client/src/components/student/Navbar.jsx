import React, { useContext } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from 'axios';

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const location = useLocation();

  const { navigate, isEducator, backendUrl, setIsEducator, getToken } = useContext(AppContext);

  const isCourselistPage = location.pathname.includes("/course-list");

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate('/educator');
        return;
      }
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/educator/update-role', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setIsEducator(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-2 sm:px-10 md:px-5 lg:px-36 border-b-2 shadow-md  py-4 ${
        isCourselistPage ? "bg-white" : "bg-200"
      }`}
    >
      <img onClick={() => navigate('/')}
        src={assets.logo}
        alt="logo"
        className="w-16 lg:w-20 cursor-pointer"
      />

      <div className="hidden md:flex items-center gap-5 text-gray-500">
        <div>
          {user && (
            <>
              {/* <button onClick={becomeEducator}>{isEducator ? 'Educator DashBoard ' : 'Become Educator '}</button> */}
              {isEducator ? <button onClick={becomeEducator}>Educator DashBoard</button>:<Link to="/my-enrollments">My Enrollments</Link>}
              
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-blue-500 text-white px-5 py-2 rounded-full"
          >
            Create account
          </button>
        )}
      </div>
      {/* for phone */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              <button onClick={becomeEducator}>{isEducator ? 'Educator DashBoard ' : 'Become Educator '}</button>
              | <Link to="/my-enrollments">My Enrollments</Link>
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt="" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
