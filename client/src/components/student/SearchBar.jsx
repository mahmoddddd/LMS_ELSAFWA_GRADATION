import React, { useState } from "react";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ data }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState(data ? data : "");

  const onSearchhandler = (e) => {
    e.preventDefault();
    navigate("/course-list/" + input);
  };

  return (
    <form
      onSubmit={onSearchhandler}
      className="w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-white border border-gray-300 rounded-lg shadow-sm p-2 sm:p-0"
    >
      <div className="flex items-center px-3">
        <img
          src={assets.search_icon}
          alt="search_icon"
          className="w-5 h-5 sm:w-6 sm:h-6"
        />
      </div>

      <input
        onChange={(e) => setInput(e.target.value)}
        value={input}
        type="text"
        placeholder="Search for courses"
        className="flex-1 px-3 py-2 text-gray-700 placeholder-gray-400 outline-none"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all text-sm sm:text-base"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
