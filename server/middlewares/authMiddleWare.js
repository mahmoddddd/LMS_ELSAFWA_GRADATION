import { clerkClient } from "@clerk/clerk-sdk-node";

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(token);
    if (!session) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Get user data from Clerk
    const user = await clerkClient.users.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      clerkId: user.id,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const protectEducator = async (req, res, next) => {
  try {
    // First authenticate the user
    await authenticateUser(req, res, async () => {
      // Check if user is an educator
      const user = await clerkClient.users.getUser(req.user.clerkId);
      const isEducator = user.publicMetadata?.isEducator;

      if (!isEducator) {
        return res
          .status(403)
          .json({ error: "Access denied. Educators only." });
      }

      next();
    });
  } catch (error) {
    console.error("Educator middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
