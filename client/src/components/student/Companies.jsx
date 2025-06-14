import React from "react";
import { assets } from "../../assets/assets";

const Companies = () => {
  return (
    <div className="pt-12 px-4 sm:px-6 lg:px-20">
      <p className="text-center text-sm sm:text-base text-gray-500">
        Trusted by learners from
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 lg:gap-16 mt-6 md:mt-10">
        {[
          {
            href: "https://www.microsoft.com",
            img: assets.microsoft_logo,
            caption: "© Microsoft Corporation",
          },
          {
            href: "https://www.walmart.com",
            img: assets.walmart_logo,
            caption: "© Walmart Inc.",
          },
          {
            href: "https://www.accenture.com",
            img: assets.accenture_logo,
            caption: "© Accenture PLC",
          },
          {
            href: "https://www.adobe.com",
            img: assets.adobe_logo,
            caption: "© Adobe Inc.",
          },
          {
            href: "https://www.paypal.com",
            img: assets.paypal_logo,
            caption: "© PayPal Holdings, Inc.",
          },
        ].map((company, index) => (
          <figure
            key={index}
            className="flex flex-col items-center text-center w-24 sm:w-28"
          >
            <a href={company.href} target="_blank" rel="noopener noreferrer">
              <img
                src={company.img}
                alt={company.caption}
                className="w-full h-auto object-contain"
              />
            </a>
            <figcaption className="text-xs text-gray-500 mt-1">
              {company.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
};

export default Companies;
