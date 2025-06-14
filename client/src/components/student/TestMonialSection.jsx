import React from "react";
import { assets, dummyTestimonial } from "../../assets/assets";

const TestMonialSection = () => {
  return (
    <div className="pb-14 px-4 sm:px-8 md:px-0">
      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-medium text-gray-800 text-center sm:text-left">
        Testimonials
      </h1>
      <p className="text-sm sm:text-base text-gray-500 mt-3 text-center sm:text-left">
        Hear from our learners as they share their journeys of transformation,
        success,
        <br className="hidden sm:block" />
        and how our platform has made a difference in their lives.
      </p>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="text-sm text-left border border-gray-200 pb-6 bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Image & Details */}
            <div className="flex items-center py-4 px-5 space-x-4 bg-gray-100">
              <img
                className="h-12 w-12 rounded-full"
                src={testimonial.image}
                alt={testimonial.name}
              />
              <div>
                <h1 className="text-base font-medium text-gray-800">
                  {testimonial.name}
                </h1>
                <p className="text-gray-600 text-sm">{testimonial.role}</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="p-5 pb-7">
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src={
                      i < Math.floor(testimonial.rating)
                        ? assets.star
                        : assets.star_blank
                    }
                    alt="star"
                    className="h-5"
                  />
                ))}
              </div>
              <p className="text-gray-500 mb-3">{testimonial.feedback}</p>
              <a href="#" className="text-blue-500 underline text-sm">
                Read more
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestMonialSection;
