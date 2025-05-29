import React from 'react'
import { assets, dummyEducatorData } from '../../assets/assets'
import { UserButton,useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'



const NavBar = () => {
const educatorData =dummyEducatorData
const {user} =useUser()

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b-2 shadow-md py-3'>
      <Link to='/'>
        <img src={assets.logo} alt='Logo' className='w-16 lg:w-18'/>

      </Link>
      <div className='flex itmes-center gap-5 text-gray-500 relative'>
        <p>Hi! {user ? user.fullName : 'Developers'}</p>
      {user ? <UserButton/> : <img className='max-w-8'src={assets.profile_img}/>}
      
      
      </div>
    </div>
  )
}

export default NavBar
