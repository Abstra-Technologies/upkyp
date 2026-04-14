"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthBackground from "@/components/authentication/AuthBackground";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStep = Number(sessionStorage.getItem("forgotPasswordStep"));
      if (storedStep) setStep(storedStep);

      const storedEmail = sessionStorage.getItem("forgotPasswordEmail");
      if (storedEmail) setEmail(storedEmail);

      const countdownEnd = Number(sessionStorage.getItem("otpCountdownEnd"));
      if (countdownEnd) {
        const remaining = countdownEnd - Date.now();
        if (remaining > 0) setTimer(Math.floor(remaining / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("forgotPasswordStep", step.toString());
    }
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-request", { email });
      toast.success("OTP sent to your email. Enter OTP to proceed.");
      setStep(2);

      sessionStorage.setItem("forgotPasswordEmail", email);

      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(10 * 60);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendLoading || timer > 0) return;

    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/resend-otp-password", {
        email,
      });
      toast.success(response.data.message || "New OTP sent to your email.");
      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(10 * 60);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    }
    setResendLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp-reset", {
        email,
        otp,
      });
      setResetToken(response.data.resetToken);
      toast.success("OTP verified. Set your new password.");
      setStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      toast.error("Missing reset token.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/auth/reset-password",
        { resetToken, newPassword },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Password reset successfully! Redirecting...");
      sessionStorage.clear();
      setTimeout(() => router.push("/pages/auth/login"), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  return (
    <AuthBackground>
      <div className="flex flex-col min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Main - Centered */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md">
            {/* Back Link */}
            <Link
              href="/pages/auth/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Reset your password
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {step === 1 &&
                    "Enter your email to receive a verification code"}
                  {step === 2 && "Enter the code sent to your email"}
                  {step === 3 && "Create a new secure password"}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        step > s
                          ? "bg-emerald-500 text-white"
                          : step === s
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-12 h-0.5 mx-1 ${
                          step > s ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Email */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleEmailSubmit}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: OTP */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Code sent to{" "}
                        <span className="font-medium">{email}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-sm">
                    {timer > 0 ? (
                      <p className="text-gray-500">
                        Resend available in{" "}
                        <span className="font-medium text-gray-700">
                          {Math.floor(timer / 60)}:
                          {String(timer % 60).padStart(2, "0")}
                        </span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOTP}
                        disabled={resendLoading}
                        className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                      >
                        {resendLoading ? "Sending..." : "Resend code"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-800">
                        Email verified. Create your new password.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {confirmPassword && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        newPassword === confirmPassword
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Passwords don't match
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleResetPassword}
                    disabled={
                      loading ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset password
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthBackground>
  );
}
