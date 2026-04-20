"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import useAuthStore from "@/zustand/authStore";
import { logEvent } from "@/utils/gtag";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export function useLoginForm({
                                 callbackUrl,
                             }: {
    callbackUrl?: string | null;
} = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, fetchSession, loading } = useAuthStore();

    const hasFetched = useRef(false);

    const errorParam = searchParams.get("error");

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    /* =====================================================
       SESSION HYDRATION (SAFE + ONCE)
    ===================================================== */
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchSession();
        }
    }, [fetchSession]);

    /* =====================================================
       REDIRECT IF ALREADY AUTHENTICATED (NO FLICKER)
    ===================================================== */
    useEffect(() => {
        if (loading) return;

        if (user) {
            const safeRedirect = getSafeRedirect(callbackUrl, user.userType);
            router.replace(safeRedirect);
        }
    }, [user, loading, callbackUrl, router]);

    /* =====================================================
       HANDLE ERROR PARAM
    ===================================================== */
    useEffect(() => {
        if (errorParam) {
            setErrorMessage("Authentication failed. Please try again.");
        }
    }, [errorParam]);

    /* =====================================================
       INPUT HANDLER (SANITIZED)
    ===================================================== */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [id]: value.trimStart(), // prevent leading spaces
        }));

        if (errorMessage) setErrorMessage("");
    };

    /* =====================================================
       GOOGLE SIGN-IN (SAFE REDIRECT)
    ===================================================== */
    const handleGoogleSignin = () => {
        if (isLoggingIn) return;

        logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);

        const cb = callbackUrl
            ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "";

        window.location.assign(`/api/auth/google-login${cb}`);
    };

    /* =====================================================
       SUBMIT LOGIN (HARDENED)
    ===================================================== */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoggingIn) return; // prevent double submit

        try {
            loginSchema.parse(formData);
        } catch {
            setErrorMessage("Please enter valid credentials.");
            return;
        }

        if (!captchaToken) {
            setErrorMessage("Please verify you're not a robot.");
            return;
        }

        setIsLoggingIn(true);
        setErrorMessage("");

        try {
            const controller = new AbortController();

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                signal: controller.signal,
                body: JSON.stringify({
                    ...formData,
                    captchaToken,
                    rememberMe,
                    callbackUrl,
                }),
            });

            /* ============================
               HANDLE REDIRECT RESPONSE
            ============================ */
            if (res.redirected) {
                window.location.replace(res.url);
                return;
            }

            const data = await res.json();

            /* ============================
               HANDLE 2FA
            ============================ */
            if (res.ok && data?.requires_otp) {
                const twoFaUrl = `/auth/verify-2fa?user_id=${data.user_id}${
                    callbackUrl
                        ? `&callbackUrl=${encodeURIComponent(callbackUrl)}`
                        : ""
                }`;

                router.replace(twoFaUrl);
                return;
            }

            /* ============================
               HANDLE ERROR
            ============================ */
            if (!res.ok) {
                setErrorMessage(data?.error || "Invalid credentials");

                resetCaptcha();
                return;
            }

            /* ============================
               SUCCESS (NON-REDIRECT API)
            ============================ */
            await fetchSession();

            const safeRedirect = getSafeRedirect(callbackUrl, data.userType);
            router.replace(safeRedirect);
        } catch (err: any) {
            console.error("[Login Error]", err);

            if (err.name !== "AbortError") {
                setErrorMessage("Network error. Please try again.");
                resetCaptcha();
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    /* =====================================================
       HELPERS
    ===================================================== */
    function resetCaptcha() {
        (window as any).grecaptcha?.reset();
        setCaptchaToken(null);
    }

    function getSafeRedirect(cb: string | null | undefined, userType: string) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (cb && baseUrl) {
            const isValid =
                cb.startsWith(`${baseUrl}/tenant/`) ||
                cb.startsWith(`${baseUrl}/landlord/`) ||
                cb.startsWith(`${baseUrl}/auth/`);

            if (isValid) return cb;
        }

        return userType === "tenant"
            ? "/tenant/feeds"
            : "/landlord/dashboard";
    }

    return {
        formData,
        showPassword,
        setShowPassword,
        errorMessage,
        isLoggingIn,
        captchaToken,
        setCaptchaToken,
        rememberMe,
        setRememberMe,
        handleChange,
        handleGoogleSignin,
        handleSubmit,
        loading, // expose for UI
    };
}