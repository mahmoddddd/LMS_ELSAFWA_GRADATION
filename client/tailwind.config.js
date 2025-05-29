/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Or wherever your components are
  ],
  theme: {
    extend: {
      fontSize :{
        'home-heading-small': ['28px','34px'],
        'home-heading-large': ['48px','56px'],
        'course-details-heading-small': ['24px','30px'],
        'course-details-heading-large': ['36px','42px'],
        default: ['15px','21px']
      },
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill, minmax(250px, 1fr))'
    },
    spacing:{
      'section-height' :'500px',
    },
    maxwidth:{
      'course-card':'422px'

    },
    boxShadow:{
'custom-card':'0px 4px 15px 2px rgba(0 0 0 0.1)'
    }, 
   },
},
  plugins: [],
}