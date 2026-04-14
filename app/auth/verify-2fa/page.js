"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

const TIMER_DURATION = 10 * 60;

const SearchParamsWrapper = ({ setUserId }) => {
  const searchParams = useSearchParams();
  const user_id = searchParams.get("user_id");

  useEffect(() => {
    setUserId(user_id);
  }, [user_id, setUserId]);

  return null;
};

export default function Verify2FA() {
  const router = useRouter();
  const [user_id, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const storedExpiry = sessionStorage.getItem("otp_timer_expiry");
    if (storedExpiry) {
      const remainingTime = Math.floor(
        (parseInt(storedExpiry) - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        setTimeLeft(remainingTime);
        return;
      }
    }
    resetTimer();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem("otp_timer_expiry");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const resetTimer = () => {
    setTimeLeft(TIMER_DURATION);
    sessionStorage.setItem(
      "otp_timer_expiry",
      Date.now() + TIMER_DURATION * 1000
    );
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/verify2faCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, otp }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire("Success", "OTP verified successfully!", "success");

        if (data.user.userType === "tenant") {
          router.push("/pages/tenant/my-unit");
        } else if (data.user.userType === "landlord") {
          router.push("/pages/landlord/dashboard");
        } else {
          setMessage("Invalid user type.");
        }

        localStorage.removeItem("pending_2fa");

      } else {
        setMessage(data.error || "Invalid OTP.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong.");
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire("Success", "OTP resend successful!", "success");
        resetTimer();
      } else {
        setResendMessage(data.error);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setResendMessage("Something went wrong while resending OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper setUserId={setUserId} />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-gray-600 text-center mb-2">
            Enter the OTP sent to your registered email or phone.
          </p>
          <p className="text-sm text-gray-600 text-center mb-6">
            Resend available in: {formatTime(timeLeft)}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP Code
              </label>
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
              Verify OTP
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-red-500">{message}</p>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn’t receive the OTP?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              className={`w-full py-2 text-white font-medium rounded-md transition ${
                isResending || timeLeft > 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
              disabled={isResending || timeLeft > 0}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
          </div>

          {resendMessage && (
            <p className="mt-2 text-center text-sm text-green-500">
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </Suspense>
  );
}
