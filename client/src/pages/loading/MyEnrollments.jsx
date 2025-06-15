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
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const sessionId = searchParams.get("session_id");
        if (!sessionId) {
          console.error("No session ID found in URL");
          setError("No session ID found. Please try again.");
          setTimeout(() => navigate("/my-enrollments"), 3000);
          return;
        }

        const token = await getToken();
        if (!token) {
          setError("Authentication failed. Please login again.");
          setTimeout(() => navigate("/sign-in"), 3000);
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
          toast.success("Payment completed successfully!");
          setTimeout(() => {
            navigate("/my-enrollments?refresh=true");
          }, 2000);
        } else {
          console.error("Payment processing failed:", data.message);
          setError(
            data.message || "Failed to process payment. Please try again."
          );
          setTimeout(() => navigate("/my-enrollments"), 3000);
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        setError(
          error.response?.data?.message ||
            "An error occurred while processing your payment. Please try again."
        );
        setTimeout(() => navigate("/my-enrollments"), 3000);
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, navigate, getToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
          <p className="text-gray-600">
            Please wait while we process your payment and enroll you in the
            course...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingMyEnrollments;
