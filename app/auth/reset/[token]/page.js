"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useForgotPasswordStore from "../../../../../zustand/forgotStore";

const ResetPassword = () => {
  const {
    resetToken,
    setResetToken,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setIsLoading,
    message,
    setMessage,
    isLoading,
  } = useForgotPasswordStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get the reset token from the URL query params
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
    } else {
      setMessage("Invalid or expired reset token.");
      router.push("/forgot-password");
    }
  }, [searchParams, setResetToken, setMessage, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password: newPassword }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      router.push("/login");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
        <h1 className="text-3xl font-semibold text-center text-gray-800">
          Reset Password
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Enter your new password to reset your account.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your new password"
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Confirm your new password"
              required
            />
          </div>
          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                message.includes("successfully")
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 text-white font-medium rounded-md transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
