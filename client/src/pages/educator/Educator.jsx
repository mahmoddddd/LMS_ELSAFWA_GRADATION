import React, { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import NavBar from "../../components/educator/NavBar";
import SideBar from "../../components/educator/SideBar";
import Footer from "../../components/educator/Footer";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import NavigationButtons from "../../components/NavigationButtons";

const Educator = () => {
  const { user } = useUser();
  const { isEducator } = useContext(AppContext);
  const navigate = useNavigate();

  console.log("🔍 Educator component - user:", user);
  console.log("🔍 Educator component - isEducator:", isEducator);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (!isEducator) {
      navigate("/");
      return;
    }
  }, [user, isEducator, navigate]);

  if (!user || !isEducator) {
    return <Loading />;
  }

  return (
    <div className="text-default min-h-screen bg-white">
      <NavBar />
      <NavigationButtons />
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
