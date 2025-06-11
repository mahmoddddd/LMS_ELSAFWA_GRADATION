import { clerkClient } from "@clerk/clerk-react";

export const getToken = async () => {
  try {
    const token = await clerkClient.session.getToken();
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    throw error;
  }
};
