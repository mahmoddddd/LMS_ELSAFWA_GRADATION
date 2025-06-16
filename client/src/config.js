// Backend API URL

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  "https://lms-backend-omega-two.vercel.app/api";

// Other configuration constants can be added here
export const config = {
  backendUrl,
  // Add other config values as needed
};
