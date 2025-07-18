# 🎓 LMS Elsafwa – Graduation Project

A full-stack **Learning Management System (LMS)** built for our graduation project.  
This platform allows educators to create courses, manage content, enroll students, and evaluate progress using quizzes and more.

🔗 **Live Site:** [https://lms-elsafwa-gradation.vercel.app](https://lms-elsafwa-gradation.vercel.app)

---

## 📦 Features

- User Authentication with Clerk
- Instructor and Student roles
- Course creation & file uploads (videos, PDFs)
- Secure payments using Stripe
- AI integration with OpenRouter
- Quiz system with grading
- Email notifications via Gmail
- Image & file uploads via Cloudinary and UploadThing

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, MongoDB, Stripe, Clerk
- **Frontend:** React + TypeScript, Tailwind CSS
- **Deployment:** Vercel

---

## 🚀 Getting Started (for development)

### 1. Clone the project

```bash
git clone https://github.com/mahmoddddd/LMS_ELSAFWA_GRADATION
cd LMS_ELSAFWA_GRADATION

2. Install dependencies

npm install

update client/src/config.js
export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL as string,
  // Add other constants as needed
};


🔧 Environment Configuration

 3. Create .env file
 # Cloudinary (example keys)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret
// VITE_BACKEND_URL=http://localhost:4000/api
// for production :  VITE_BACKEND_URL=https://lms-backend-omega-two.vercel.app/api

# MongoDB
MONGODB_URI=your_mongodb_uri

# Clerk
CLERK_SECRET_KEY=your_clerk_secret
CLERK_WEBHOOK_SECRET=your_clerk_webhook
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
VITE_CURRENCY=USD

# JWT and OpenRouter
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_key

# Email
MAIL_ID=your_gmail
PASS_MAIL=your_app_password

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# CORS
CORS_ORIGIN=http://localhost:3000
CLERK_JWT_KEY=your_jwt_key



4. Start the server

npm start



🧪 Testing
Use tools like Postman to test your backend APIs
(clerk authentication tokens required for secured endpoints).



📂 Folder Structure

/server
  ├── controllers/
  ├── routes/
  ├── models/
  ├── utils/
  └── server.js
/client
  └── (React Frontend)


For any inquiries or collaboration:

Mahmoud Emad
📧 mahmodd.elsheriff@gmail.com
📱 +20 01002084496
🔗 GitHub: https://github.com/mahmoddddd/LMS_ELSAFWA_GRADATION

   Portfolio : https://mahmoddddd.github.io/


🏷️ Tags
#Nodejs #Backend #LMS #Clerk #Stripe #MongoDB #RESTAPI #OpenToWork #JuniorBackendDeveloper

```
