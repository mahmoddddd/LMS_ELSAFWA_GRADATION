import React from 'react'
import { assets, dummyTestimonial } from '../../assets/assets'

const TestMonialSection = () => {
  return (
    <div className='pb-14 px-8 md:px-0'>
      {/* Heading */}
      <h1 className='text-3xl font-medium text-gray-800'>Testimonials</h1>
      <p className='md:text-base text-gray-500 mt-3'>
        Hear from our learners as they share their journeys of transformation, success,
        <br /> and how our platform has made a difference in their lives.
      </p>

      {/* Testimonials List */}
      <div className='grid grid-cols-auto  gap-4 mt-10'>
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className='text-sm text-left border border-gray-500/30 pb-6 bg-white rounded-lg shadow-[0px_4px_5px_0px] shadow=black/5 overflow-hidden gap-4'
          >
            {/* Image & Details */}
            <div className='flex items-center py-4 px-5 space-x-4 bg-gray-500/10 gap-4'>
              <img className='h-12 w-12 rounded-full'
                src={testimonial.image}
                alt={testimonial.name}
              />
              <div>
                <h1 className='text-lg font-medium text-gray-800'>{testimonial.name}</h1>
                <p className=' text-gray-800/80'>{testimonial.role}</p>
              </div>

            
            
          </div>
          <div className='p-5 pb-7'>
          <div className='flex gap-0.5'>
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src={i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank}
                    alt='star'
                    className=' h-5'
                  />
                ))}
              </div>
              <p
                className='text-gray-500'>{testimonial.feedback}</p>
              <a href='#' className='text-blue-500 underline px-5'>Read more</a>
            </div>
          </div>
          
        ))}
      </div>
    </div>
  )
}

export default TestMonialSection
