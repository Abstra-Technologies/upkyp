"use client";

import { useState, useEffect } from "react";
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
    const { user, fetchSession } = useAuthStore();

    const errorParam = searchParams.get("error");

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    /* =====================================================
       DO NOT FORCE REDIRECT ON MOUNT
    ===================================================== */
    useEffect(() => {
        fetchSession();
    }, []);

    /* =====================================================
       ERROR FROM QUERY PARAM
    ===================================================== */
    useEffect(() => {
        if (errorParam) {
            setErrorMessage("Authentication failed. Please try again.");
        }
    }, [errorParam]);

    /* =====================================================
       FORM HANDLERS
    ===================================================== */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        if (errorMessage) setErrorMessage("");
    };

    const handleGoogleSignin = () => {
        logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);

        const cb = callbackUrl
            ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "";

        window.location.href = `/api/auth/google-login${cb}`;
    };

    /* =====================================================
       SUBMIT LOGIN
    ===================================================== */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            loginSchema.parse(formData);
        } catch {
            setErrorMessage("Please fill in valid credentials.");
            return;
        }

        if (!captchaToken) {
            setErrorMessage("Please verify you're not a robot.");
            return;
        }

        setIsLoggingIn(true);
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...formData,
                    captchaToken,
                    rememberMe,
                    callbackUrl,
                }),
            });

            if (res.redirected) {
                const redirectUrl = res.url;
                window.location.href = redirectUrl;
                return;
            }

            const data = await res.json();

            if (res.ok && data?.requires_otp) {
                const twoFaUrl = `/auth/verify-2fa?user_id=${data.user_id}${
                    callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
                }`;
                router.push(twoFaUrl);
                return;
            }

            if (!res.ok) {
                setErrorMessage(data?.error || "Invalid credentials");
                (window as any).grecaptcha?.reset();
                setCaptchaToken(null);
                return;
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Something went wrong. Please try again.");
            (window as any).grecaptcha?.reset();
            setCaptchaToken(null);
        } finally {
            setIsLoggingIn(false);
        }
    };

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
    };
}