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

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

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

      const countdownEnd = Date.now() + 5 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(5 * 60);
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
      const countdownEnd = Date.now() + 5 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(5 * 60);
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
    if (!isPasswordValid) {
      toast.error("Password does not meet all requirements.");
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

    console.log('reset token: ', resetToken);

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
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  return (
    <AuthBackground>
      <div className="flex flex-col h-screen overflow-hidden">
        <ToastContainer position="top-right" autoClose={3000} />

        <main className="flex-1 flex items-start justify-center px-3 sm:px-6 pt-2 sm:pt-8 sm:items-center pb-4">
          <div className="w-full max-w-md">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
              <div className="text-center mb-3 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Reset your password
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {step === 1 &&
                    "Enter your email to receive a verification code"}
                  {step === 2 && "Enter the code sent to your email"}
                  {step === 3 && "Create a new secure password"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-8">
                {[1, 2, 3].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                        step > s
                          ? "bg-emerald-500 text-white"
                          : step === s
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step > s ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s}
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-8 sm:w-12 h-0.5 mx-1 ${
                          step > s ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleEmailSubmit}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
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

              {step === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-xs sm:text-sm text-blue-800">
                        Code sent to{" "}
                        <span className="font-medium">{email}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-center text-xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
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

                  <div className="text-center text-xs sm:text-sm">
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

              {step === 3 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs sm:text-sm text-emerald-800">
                        Email verified. Create your new password.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <p className={`text-xs ${passwordChecks.length ? "text-emerald-600" : "text-gray-500"}`}>
                        {passwordChecks.length ? "✓" : "○"} 8+ characters
                      </p>
                      <p className={`text-xs ${passwordChecks.uppercase ? "text-emerald-600" : "text-gray-500"}`}>
                        {passwordChecks.uppercase ? "✓" : "○"} Uppercase
                      </p>
                      <p className={`text-xs ${passwordChecks.lowercase ? "text-emerald-600" : "text-gray-500"}`}>
                        {passwordChecks.lowercase ? "✓" : "○"} Lowercase
                      </p>
                      <p className={`text-xs ${passwordChecks.number ? "text-emerald-600" : "text-gray-500"}`}>
                        {passwordChecks.number ? "✓" : "○"} Number
                      </p>
                      <p className={`text-xs ${passwordChecks.special ? "text-emerald-600" : "text-gray-500"}`}>
                        {passwordChecks.special ? "✓" : "○"} Special char
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      className={`flex items-center gap-2 text-xs sm:text-sm ${
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
                      !isPasswordValid ||
                      newPassword !== confirmPassword
                    }
                    className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
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
