import dotenv from 'dotenv';
dotenv.config();

console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY);
// in this commit < all file work till user creat acount and login with no error and 
// user can create its role to educator and log in again and see educator page and its redirect to dashboard