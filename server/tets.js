import dotenv from 'dotenv';
dotenv.config();

console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY);
