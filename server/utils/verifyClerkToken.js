import jwt from 'jsonwebtoken';

export const extractClerkUserId = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.decode(token);
    return decoded?.sub || null; // Clerk userId موجود في `sub`
  } catch (error) {
    console.error("Failed to decode Clerk token:", error.message);
    return null;
  }
};
