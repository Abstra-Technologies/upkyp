"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import useAuthStore from "@/zustand/authStore";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [cooldown, setCooldown] = useState(60); // 60 seconds cooldown
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    /* =========================================
       LOAD SESSION
    ========================================= */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* =========================================
       REDIRECT IF VERIFIED
    ========================================= */
    useEffect(() => {
        if (!user) return;

        if (user.emailVerified) {
            if (user.userType === "tenant") {
                router.replace("/tenant/feeds");
            } else {
                router.replace("/landlord/dashboard");
            }
        }
    }, [user, router]);

    /* =========================================
       60 SECOND COOLDOWN TIMER
    ========================================= */
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    };

    /* =========================================
       VERIFY OTP
    ========================================= */
    const handleVerify = async () => {
        if (otp.length !== 6 || isNaN(Number(otp))) {
            toast.error("OTP must be a 6-digit number");
            return;
        }

        setVerifying(true);

        try {
            const res = await axios.post(
                "/api/auth/verify-otp-reg",
                { otp },
                { withCredentials: true }
            );

            toast.success(res.data.message);

            setTimeout(() => {
                if (res.data.userType === "tenant") {
                    router.replace("/tenant/feeds");
                } else {
                    router.replace("/landlord/dashboard");
                }
            }, 1200);

        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                "OTP verification failed"
            );
        } finally {
            setVerifying(false);
        }
    };

    /* =========================================
       RESEND OTP (1 MINUTE COOLDOWN)
    ========================================= */
    const handleResendOTP = async () => {
        if (cooldown > 0) return;

        setResending(true);

        try {
            const res = await axios.post("/api/auth/resend-otp-reg");
            toast.info(res.data.message || "New OTP sent");

            // 🔥 Restart cooldown to 60 seconds
            setCooldown(60);

        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                "Failed to resend OTP"
            );
        } finally {
            setResending(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">

            <ToastContainer />

            {/* ================= CONTENT ================= */}
            <div className="flex flex-1 items-center justify-center px-4 py-16">

                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">

                    {/* Title Section */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-blue-600 text-xl font-bold">✉</span>
                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Verify your email
                        </h2>

                        <p className="text-sm text-gray-500 leading-relaxed">
                            Enter the 6-digit verification code sent to your registered email.
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-6">
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            maxLength={6}
                            inputMode="numeric"
                            className="w-full text-center text-3xl tracking-[0.7em] py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                            placeholder="• • • • • •"
                        />
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 transition-all disabled:opacity-60 shadow-lg"
                    >
                        {verifying ? "Verifying..." : "Verify Email"}
                    </button>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">
            Didn’t receive the code?
          </span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Resend Section */}
                    <div className="text-center">
                        {cooldown > 0 ? (
                            <p className="text-sm text-gray-500">
                                You can request a new code in{" "}
                                <span className="font-semibold text-gray-900">
                {formatTime(cooldown)}
              </span>
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOTP}
                                disabled={resending}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                {resending ? "Resending..." : "Resend Code"}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );

}
