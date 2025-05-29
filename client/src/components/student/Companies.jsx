import React from 'react'
import { assets } from '../../assets/assets'

const Companies = () => {
  return (
    <div className='pt-16'>
<p className='text-base text-gray-500'>Trusted by learners from </p>
<div className="flex flex-wrap items-center justify-center gap-6 md:mt-10 mt-5 md:gap-16">
  <figure className="flex flex-col items-center">
    <a href="https://www.microsoft.com" target="_blank" rel="noopener noreferrer">
      <img src={assets.microsoft_logo} alt="Microsoft" className="w-20 md:w-28"/>
    </a>
    <figcaption className="text-xs text-gray-500 mt-1">© Microsoft Corporation</figcaption>
  </figure>
  <figure className="flex flex-col items-center">
    <a href="https://www.walmart.com" target="_blank" rel="noopener noreferrer">
      <img src={assets.walmart_logo} alt="Walmart" className="w-20 md:w-28"/>
    </a>
    <figcaption className="text-xs text-gray-500 mt-1">© Walmart Inc.</figcaption>
  </figure>
  <figure className="flex flex-col items-center">
    <a href="https://www.accenture.com" target="_blank" rel="noopener noreferrer">
      <img src={assets.accenture_logo} alt="Accenture" className="w-20 md:w-28"/>
    </a>
    <figcaption className="text-xs text-gray-500 mt-1">© Accenture PLC</figcaption>
  </figure>
  <figure className="flex flex-col items-center">
    <a href="https://www.adobe.com" target="_blank" rel="noopener noreferrer">
      <img src={assets.adobe_logo} alt="Adobe" className="w-20 md:w-28"/>
    </a>
    <figcaption className="text-xs text-gray-500 mt-1">© Adobe Inc.</figcaption>
  </figure>
  <figure className="flex flex-col items-center">
    <a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer">
      <img src={assets.paypal_logo} alt="PayPal" className="w-20 md:w-28"/>
    </a>
    <figcaption className="text-xs text-gray-500 mt-1">© PayPal Holdings, Inc.</figcaption>
  </figure>
</div>


    </div>
  )
}

export default Companies
