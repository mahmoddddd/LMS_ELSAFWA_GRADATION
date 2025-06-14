import React, { useContext, useEffect } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const location = useLocation();

  const {
    navigate,
    isEducator,
    backendUrl,
    setIsEducator,
    getToken,
  } = useContext(AppContext);

  const isCourselistPage = location.pathname.includes("/course-list");

  useEffect(() => {
    const checkEducatorStatus = async () => {
      if (user?.id) {
        try {
          const clerkRole = user.publicMetadata?.role;
          console.log("🔍 Navbar - Clerk role:", clerkRole);

          if (clerkRole === "educator" && !isEducator) {
            console.log("🔄 Navbar - Updating educator state from Clerk");
            setIsEducator(true);
          }

          const token = await getToken();
          const { data } = await axios.get(backendUrl + "/api/user/data", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data.success && data.user.role === "educator") {
            if (!isEducator) {
              console.log("🔄 Navbar - Updating educator state from database");
              setIsEducator(true);
            }
          }
        } catch (error) {
          console.error("❌ Error checking educator status:", error);
        }
      }
    };

    checkEducatorStatus();
  }, [
    user?.id,
    user?.publicMetadata?.role,
    isEducator,
    setIsEducator,
    getToken,
    backendUrl,
  ]);

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate("/educator");
        return;
      }

      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + "/api/educator/update-role",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setIsEducator(true);
        toast.success(data.message);
        setTimeout(() => {
          navigate("/educator");
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to become educator");
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-2 sm:px-10 md:px-5 lg:px-36 border-b-2 shadow-md py-4 ${
        isCourselistPage ? "bg-white" : "bg-200"
      }`}
    >
      {/* Logo */}
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="logo"
        className="w-16 lg:w-20 cursor-pointer"
      />

      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-5 text-gray-500">
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                onClick={becomeEducator}
                className={`transition-colors ${
                  isEducator
                    ? "text-green-600 hover:text-green-800 font-medium"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {isEducator ? "Educator Dashboard" : "Become Educator"}
              </button>
              <Link
                to="/my-enrollments"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                My Enrollments
              </Link>
              <Link
                to="/my-quizzes"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                My Quizzes
              </Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            {isEducator && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Educator
              </span>
            )}
            <UserButton />
          </div>
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 transition-colors"
          >
            Create account
          </button>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col items-end gap-2 text-gray-500 text-sm pr-2">
        <div className="flex flex-wrap justify-end gap-2 w-full">
          {user && (
            <>
              <button
                onClick={becomeEducator}
                className={`transition-colors text-xs ${
                  isEducator
                    ? "text-green-600 hover:text-green-800 font-medium"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {isEducator ? "Dashboard" : "Become"}
              </button>
              <Link
                to="/my-enrollments"
                className="text-gray-600 hover:text-gray-800 transition-colors text-xs"
              >
                Enrollments
              </Link>
              <Link
                to="/my-quizzes"
                className="text-gray-600 hover:text-gray-800 transition-colors text-xs"
              >
                Quizzes
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {isEducator && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
              <UserButton />
            </>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <img src={assets.user_icon} alt="user icon" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
