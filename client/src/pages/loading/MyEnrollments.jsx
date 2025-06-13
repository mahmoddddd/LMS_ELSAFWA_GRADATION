import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { backendUrl } from "../../config";
import { toast } from "react-hot-toast";

const LoadingMyEnrollments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const sessionId = searchParams.get("session_id");
        if (!sessionId) {
          console.error("No session ID found in URL");
          navigate("/my-enrollments");
          return;
        }

        const token = await getToken();
        if (!token) {
          toast.error("Authentication failed. Please login again.");
          navigate("/sign-in");
          return;
        }

        console.log(
          "🔄 Processing successful payment with session:",
          sessionId
        );

        // Call the backend to handle successful payment
        const { data } = await axios.post(
          `${backendUrl}/user/handle-payment-success`,
          { session_id: sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (data.success) {
          console.log("✅ Payment processed successfully");
          // Show success message and wait a bit before redirecting
          toast.success("Payment completed successfully!");
          setTimeout(() => {
            navigate("/my-enrollments?refresh=true");
          }, 1500);
        } else {
          console.error("❌ Failed to process payment:", data.message);
          toast.error(data.message || "Failed to process payment");
          setTimeout(() => {
            navigate("/my-enrollments");
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        toast.error(
          error.response?.data?.message || "Failed to process payment"
        );
        setTimeout(() => {
          navigate("/my-enrollments");
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, navigate, getToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">
          {loading ? "Processing your payment..." : "Redirecting..."}
        </h2>
        <p className="mt-2 text-gray-500">
          Please wait while we complete your enrollment
        </p>
      </div>
    </div>
  );
};

export default LoadingMyEnrollments;
