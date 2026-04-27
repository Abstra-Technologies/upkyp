"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useEffect, useRef } from "react";

export default function MobileLoginForm() {
    const {
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
    } = useLoginForm();

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    /* 🔥 RESET INPUTS + CAPTCHA WHEN ERROR OCCURS (ERROR MESSAGE STAYS) */
    useEffect(() => {
        if (!errorMessage) return;

        const timer = setTimeout(() => {
            handleChange({ target: { name: "email", value: "" } } as any);
            handleChange({ target: { name: "password", value: "" } } as any);
            setShowPassword(false);
            setRememberMe(false);
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [errorMessage]);

    return (
        <div className="w-full max-w-sm mx-auto bg-white p-6 rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's Sign you in.</h1>
                <div className="space-y-1">
                    <p className="text-xl text-gray-400">Welcome back</p>
                    <p className="text-xl text-gray-400">You've been missed!</p>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm text-red-600 text-center font-medium">{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your Email"
                        disabled={isLoggingIn}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter Password"
                            disabled={isLoggingIn}
                            className="w-full px-4 py-3.5 pr-12 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoggingIn}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Remember Me & Forgot */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                    </label>
                    <Link href="./forgot-password" className="text-blue-600 font-medium hover:text-blue-700">Forgot password?</Link>
                </div>

                {/* ReCAPTCHA */}
                <div className="flex justify-center transform scale-90 origin-center -my-2">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => setCaptchaToken(token)}
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoggingIn || !captchaToken}
                    className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-2xl text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                    {isLoggingIn ? "Signing in..." : "Sign In"}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <span className="relative bg-white px-4 text-sm text-gray-400">or</span>
                </div>

                {/* Social Login */}
                <div className="flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={handleGoogleSignin}
                        disabled={isLoggingIn}
                        className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.23 9.21 3.24l6.85-6.85C35.9 2.09 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l7.98 6.19C12.43 13.27 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.21-.43-4.74H24v9h12.45c-.54 2.9-2.18 5.36-4.64 7.04l7.13 5.53C43.9 37.24 46.1 31.45 46.1 24.5z" />
                            <path fill="#FBBC05" d="M10.54 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.9-2.14 15.87-5.8l-7.13-5.53c-1.98 1.33-4.51 2.12-8.74 2.12-6.26 0-11.57-3.77-13.46-8.91l-7.98 6.19C6.48 42.62 14.62 48 24 48z" />
                        </svg>
                    </button>

                </div>

                {/* Footer Link */}
                <div className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account? <Link href="/auth/selectRole" className="text-blue-600 font-semibold hover:text-blue-700">Sign up</Link>
                </div>
            </form>
        </div>
    );
}