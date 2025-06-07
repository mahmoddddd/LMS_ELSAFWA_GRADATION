import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const Loading = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const processPayment = async () => {
      try {
        if (!sessionId) {
          console.error("No session ID found");
          toast.error("Payment session not found");
          navigate("/my-enrollments");
          return;
        }

        console.log("Processing payment for session:", sessionId);
        const response = await axios.get(
          `/api/user/handle-successful-payment?session_id=${sessionId}`
        );

        if (response.data.success) {
          toast.success("Payment processed successfully!");
          // Use the redirect URL from the response if available
          if (response.data.redirectUrl) {
            window.location.href = response.data.redirectUrl;
          } else {
            navigate("/my-enrollments?refresh=true");
          }
        } else {
          toast.error(response.data.message || "Failed to process payment");
          navigate("/my-enrollments");
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        toast.error(
          error.response?.data?.message || "Failed to process payment"
        );
        navigate("/my-enrollments");
      }
    };

    processPayment();
  }, [sessionId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">
          Processing your payment...
        </h2>
        <p className="mt-2 text-gray-600">
          Please wait while we complete your enrollment.
        </p>
      </div>
    </div>
  );
};

export default Loading;
