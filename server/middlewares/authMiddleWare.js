import { clerkExpressRequireAuth, clerkClient } from "@clerk/express";

// Middleware للتحقق من المصادقة (يضيف req.auth)
export const requireAuth = clerkExpressRequireAuth();

// Middleware لحماية مسارات الـ Educator
export const protectEducator = async (req, res, next) => {
  try {
    // تأكد وجود userId من clerkExpressRequireAuth
    const userId = req.auth.userId;

    // جلب بيانات المستخدم من Clerk
    const user = await clerkClient.users.getUser(userId);

    // تحقق من الدور (role) في publicMetadata
    if (user.publicMetadata.role !== "educator") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // إذا الدور صحيح، استمر
    next();
  } catch (error) {
    console.error("Error in protectEducator:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
