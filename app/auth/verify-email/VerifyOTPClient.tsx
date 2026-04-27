"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useAuthStore from "@/zustand/authStore";
import Image from "next/image";

// Lazy load toast (non-blocking)
const ToastContainer = dynamic(
    () => import("react-toastify").then((mod) => mod.ToastContainer),
    { ssr: false }
);
const toastPromise = import("react-toastify");

export default function VerifyOTPClient() {
    const [otp, setOtp] = useState("");
    const [cooldown, setCooldown] = useState(60);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const router = useRouter();
    const { user, fetchSession, updateUser } = useAuthStore();

    /* ===============================
       NON-BLOCKING SESSION FETCH
    =============================== */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    /* ===============================
       REDIRECT IF VERIFIED
    =============================== */
    useEffect(() => {
        if (!user?.emailVerified) return;

        router.replace(
            user.userType === "tenant"
                ? "/tenant/feeds"
                : "/landlord/onboarding"
        );
    }, [user]);

    /* ===============================
       COOLDOWN TIMER (OPTIMIZED)
    =============================== */
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    };

    /* ===============================
       VERIFY OTP (FETCH INSTEAD OF AXIOS)
    =============================== */
    const handleVerify = async () => {
        const { toast } = await toastPromise;

        if (otp.length !== 6 || isNaN(Number(otp))) {
            toast.error("OTP must be a 6-digit number");
            return;
        }

        setVerifying(true);

        try {
            const res = await fetch("/api/auth/verify-otp-reg", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            toast.success(data.message || "Verified!");

            updateUser({ emailVerified: true });
            fetchSession();

            setTimeout(() => {
                router.replace(
                    data.userType === "tenant"
                        ? "/tenant/feeds"
                        : "/landlord/onboarding"
                );
            }, 800);

        } catch (err: any) {
            toast.error(err.message || "OTP verification failed");
        } finally {
            setVerifying(false);
        }
    };

    /* ===============================
       RESEND OTP
    =============================== */
    const handleResendOTP = async () => {
        if (cooldown > 0) return;

        const { toast } = await toastPromise;

        setResending(true);

        try {
            const res = await fetch("/api/auth/resend-otp-reg", {
                method: "POST",
            });

            const data = await res.json();

            toast.info(data.message || "New OTP sent");
            setCooldown(60);

        } catch (err: any) {
            toast.error("Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    /* ===============================
       🚀 FAST FIRST PAINT UI
    =============================== */
    return (
        <div className="relative min-h-screen overflow-hidden">

            {/* Background */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="City background"
                fill
                priority
                className="absolute inset-0 object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

                {/* Lazy Toast */}
                <ToastContainer />

                <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl">

                {/* Title */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-lg">✉</span>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900">
                        Verify your email
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Enter the 6-digit code sent to your email.
                    </p>
                </div>

                {/* OTP Input */}
                <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full text-center text-2xl tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="• • • • • •"
                />

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full mt-4 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
                >
                    {verifying ? "Verifying..." : "Verify Email"}
                </button>

                {/* Divider */}
                <div className="my-6 text-center text-xs text-gray-400">
                    Didn’t receive the code?
                </div>

                {/* Resend */}
                <div className="text-center">
                    {cooldown > 0 ? (
                        <p className="text-sm text-gray-500">
                            Resend in{" "}
                            <span className="font-medium text-gray-800">
                {formatTime(cooldown)}
              </span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResendOTP}
                            disabled={resending}
                            className="text-sm font-medium text-blue-600 hover:underline"
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