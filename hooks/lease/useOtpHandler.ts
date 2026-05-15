// hooks/useOtpHandler.ts
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface UseOtpHandlerProps {
    agreement_id: number | string;
    email: string;
    role?: "landlord" | "tenant";
}

export default function useOtpHandler({
                                          agreement_id,
                                          email,
                                          role = "landlord",
                                      }: UseOtpHandlerProps) {
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const [sending, setSending] = useState(false);
    const [alreadySigned, setAlreadySigned] = useState(false);

    // 🔹 Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    /** 🔍 Check if user already signed */
    const checkSignatureStatus = async (): Promise<boolean> => {
        try {
            const res = await axios.get(
                `/api/landlord/activeLease/checkSignatureStatus`,
                {
                    params: { agreement_id, role },
                }
            );

            if (res.data?.signed) {
                setAlreadySigned(true);
                Swal.fire({
                    title: "Already Signed",
                    text: `This lease has already been signed by the ${role}.`,
                    icon: "info",
                    confirmButtonColor: "#3b82f6",
                });
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Error checking signature status:", error);
            return false;
        }
    };

    /** 🔹 Send OTP */
    const sendOtp = async () => {
        if (await checkSignatureStatus()) return;

        try {
            setSending(true);
            const res = await axios.post("/api/landlord/activeLease/sendOtp", {
                agreement_id,
                role,
                email,
            });

            if (res.data?.success) {
                setOtpSent(true);
                setCooldown(60);
                Swal.fire("OTP Sent!", "Check your email for the 6-digit code.", "success");
            } else {
                Swal.fire("Error", res.data?.error || "Failed to send OTP.", "error");
            }
        } catch (error: any) {
            Swal.fire("Error", error.response?.data?.error || "Failed to send OTP.", "error");
        } finally {
            setSending(false);
        }
    };

    /** 🔹 Verify OTP */
    const verifyOtp = async (onSuccess?: () => void) => {
        if (await checkSignatureStatus()) return;

        try {
            const res = await axios.post("/api/landlord/activeLease/veritfyOtp", {
                agreement_id,
                email,
                role,
                otp_code: otpCode,
            });

            if (res.data?.success) {
                Swal.fire({
                    title: "OTP Verified!",
                    text: "Lease successfully signed and verified.",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                onSuccess?.();
            } else {
                Swal.fire("Error", res.data?.error || "Invalid OTP.", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Failed to verify OTP.", "error");
        }
    };

    /** 🔹 Resend OTP */
    const resendOtp = async () => {
        if (cooldown > 0 || resending) return;
        if (await checkSignatureStatus()) return;

        try {
            setResending(true);
            const res = await axios.post("/api/landlord/activeLease/sendOtp", {
                agreement_id,
                role,
                email,
            });

            if (res.data?.success) {
                Swal.fire({
                    title: "OTP Resent!",
                    text: "A new code has been sent to your registered email.",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setCooldown(60);
            } else {
                Swal.fire("Error", res.data?.error || "Failed to resend OTP.", "error");
            }
        } catch (error: any) {
            Swal.fire("Error", "Could not resend OTP. Please try again.", "error");
        } finally {
            setResending(false);
        }
    };

    return {
        otpSent,
        otpCode,
        setOtpCode,
        sendOtp,
        verifyOtp,
        resendOtp,
        cooldown,
        resending,
        sending,
        alreadySigned,
        checkSignatureStatus,
    };
}
