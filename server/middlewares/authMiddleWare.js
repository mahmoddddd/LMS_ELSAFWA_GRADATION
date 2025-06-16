import { requireAuth, clerkClient } from "@clerk/express";
import { extractClerkUserId } from "../utils/verifyClerkToken.js";

// Middleware to protect educator routes
export const protectEducator = async (req, res, next) => {
  try {
    // First try to get userId from auth middleware
    let userId = req.auth?.userId;

    // If not found, try to extract from authorization header
    if (!userId) {
      userId = extractClerkUserId(req.headers.authorization);
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user ID found",
      });
    }

    try {
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.publicMetadata?.role !== "educator") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: User is not an educator",
        });
      }

      // Add the user ID to the request for use in controllers
      req.userId = userId;
      next();
    } catch (error) {
      console.error("Error fetching user from Clerk:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying user role",
      });
    }
  } catch (error) {
    console.error("Error in protectEducator middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Export Clerk's built-in middleware
export { requireAuth };
