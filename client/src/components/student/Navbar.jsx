// import React, { useContext } from "react";
// import { assets } from "../../assets/assets";
// import { Link, useLocation } from "react-router-dom";
// import { useClerk, useUser, UserButton } from "@clerk/clerk-react";
// import { AppContext } from "../../context/AppContext";
// import { toast } from "react-toastify";
// import axios from "axios";

// const Navbar = () => {
//   const { openSignIn } = useClerk();
//   const { user } = useUser();
//   const location = useLocation();

//   const {
//     navigate,
//     isEducator,
//     backendUrl,
//     setIsEducator,
//     getToken,
//   } = useContext(AppContext);

//   const isCourselistPage = location.pathname.includes("/course-list");

//   const becomeEducator = async () => {
//     try {
//       if (isEducator) {
//         navigate("/educator");
//         return;
//       }
//       const token = await getToken();
//       const { data } = await axios.get(
//         backendUrl + "/api/educator/update-role",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (data.success) {
//         setIsEducator(true);
//         toast.success(data.message);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   return (
//     <div
//       className={`flex items-center justify-between px-2 sm:px-10 md:px-5 lg:px-36 border-b-2 shadow-md py-4 ${
//         isCourselistPage ? "bg-white" : "bg-200"
//       }`}
//     >
//       <img
//         onClick={() => navigate("/")}
//         src={assets.logo}
//         alt="logo"
//         className="w-16 lg:w-20 cursor-pointer"
//       />

//       <div className="hidden md:flex items-center gap-5 text-gray-500">
//         <div className="flex items-center gap-4">
//           {user && (
//             <>
//               <button
//                 onClick={becomeEducator}
//                 className="text-blue-600 hover:text-blue-800 transition-colors"
//               >
//                 {isEducator ? "Educator Dashboard" : "Become Educator"}
//               </button>
//               <Link
//                 to="/my-enrollments"
//                 className="text-gray-600 hover:text-gray-800 transition-colors"
//               >
//                 My Enrollments
//               </Link>
//             </>
//           )}
//         </div>
//         {user ? (
//           <UserButton />
//         ) : (
//           <button
//             onClick={() => openSignIn()}
//             className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 transition-colors"
//           >
//             Create account
//           </button>
//         )}
//       </div>

//       {/* Mobile view */}
//       <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
//         <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
//           {user && (
//             <>
//               <button
//                 onClick={becomeEducator}
//                 className="text-blue-600 hover:text-blue-800 transition-colors"
//               >
//                 {isEducator ? "Educator Dashboard" : "Become Educator"}
//               </button>
//               <span className="mx-2">|</span>
//               <Link
//                 to="/my-enrollments"
//                 className="text-gray-600 hover:text-gray-800 transition-colors"
//               >
//                 My Enrollments
//               </Link>
//             </>
//           )}
//         </div>
//         {user ? (
//           <UserButton />
//         ) : (
//           <button
//             onClick={() => openSignIn()}
//             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <img src={assets.user_icon} alt="user icon" className="w-6 h-6" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Navbar;
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

  // ✅ useEffect للتأكد من الـ educator state عند تحميل الكومبوننت
  useEffect(() => {
    const checkEducatorStatus = async () => {
      if (user?.id) {
        try {
          // تحقق من Clerk metadata أولاً
          const clerkRole = user.publicMetadata?.role;
          console.log("🔍 Navbar - Clerk role:", clerkRole);
          
          if (clerkRole === "educator" && !isEducator) {
            console.log("🔄 Navbar - Updating educator state from Clerk");
            setIsEducator(true);
          }
          
          // تحقق من الداتابيز كمان
          const token = await getToken();
          const { data } = await axios.get(
            backendUrl + "/api/user/data",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

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
  }, [user?.id, user?.publicMetadata?.role, isEducator, setIsEducator, getToken, backendUrl]);

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        console.log("🎓 Already educator - navigating to dashboard");
        navigate("/educator");
        return;
      }

      console.log("🔄 Converting user to educator...");
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
        console.log("✅ Successfully became educator");
        
        // انتظار قليل ثم الانتقال للداشبورد
        setTimeout(() => {
          navigate("/educator");
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("❌ Error becoming educator:", error);
      toast.error(error.message || "Failed to become educator");
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-2 sm:px-10 md:px-5 lg:px-36 border-b-2 shadow-md py-4 ${
        isCourselistPage ? "bg-white" : "bg-200"
      }`}
    >
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="logo"
        className="w-16 lg:w-20 cursor-pointer"
      />

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
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            {/* ✅ إضافة مؤشر لحالة الـ educator */}
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

      {/* Mobile view */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
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
                {isEducator ? "Dashboard" : "Become Educator"}
              </button>
              <span className="mx-2">|</span>
              <Link
                to="/my-enrollments"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Enrollments
              </Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-1">
            {/* ✅ مؤشر للموبايل */}
            {isEducator && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <UserButton />
          </div>
        ) : (
          <button
            onClick={() => openSignIn()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <img src={assets.user_icon} alt="user icon" className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;