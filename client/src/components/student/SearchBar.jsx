import React, { useState } from 'react'
import { assets } from '../../assets/assets'
import {  useNavigate } from 'react-router-dom'

const SearchBar = ({data}) => {

  const navigate =useNavigate()
  const [input, setInput] = useState(data ? data : '')

  const onSearchhandler = (e) => {
    e.preventDefault()
    navigate('/course-list/' + input)
  }
  return (
   
    <form 
    onSubmit={onSearchhandler} 
    className="max-w-xl w-full md:h-14 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm"
  >
    <div className="flex items-center px-3">
      <img src={assets.search_icon} alt="search_icon" className="w-6 h-6 md:w-auto" />
    </div>
  
    <input 
      onChange={(e) => setInput(e.target.value)} 
      value={input} 
      type="text" 
      placeholder="Search for courses" 
      className="w-full h-full px-3 py-2 text-gray-700 placeholder-gray-400 outline-none"
    />
  
    <button 
      type="submit" 
      className="bg-blue-600 text-white px-5 py-2 md:py-3 mx-2 rounded-lg shadow-md hover:bg-blue-700 transition-all"
    >
      Search
    </button>
  </form>
  
  )
}

export default SearchBar
