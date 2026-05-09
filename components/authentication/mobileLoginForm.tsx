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
        <div className="w-full max-w-sm mx-auto">
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-purple-500 rounded-t-3xl px-6 pt-8 pb-20 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/10 rounded-full blur-xl" />

                {/* Top bar */}
                <div className="relative flex items-center justify-between mb-8">
                    <button className="text-white/80 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm">Don't have an account?</span>
                        <Link
                            href="/auth/selectRole"
                            className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>

                {/* Logo */}
                <div className="relative text-center">
                    <h1 className="text-4xl font-bold text-white">Upkyp</h1>
                </div>
            </div>

            {/* White Card */}
            <div className="relative bg-white rounded-t-3xl -mt-12 px-6 pt-8 pb-8 shadow-xl">
                {/* Title */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter your details below</p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                        <p className="text-sm text-red-600 text-center font-medium">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="nicholas@gergemla.com"
                            disabled={isLoggingIn}
                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••••••"
                                disabled={isLoggingIn}
                                className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400"
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoggingIn || !captchaToken}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-400 text-white font-semibold rounded-xl text-sm hover:from-blue-700 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25"
                    >
                        {isLoggingIn ? "Signing in..." : "Sign in"}
                    </button>

                    {/* Forgot Password */}
                    <div className="text-center">
                        <Link href="./forgot-password" className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
                            Forgot your password?
                        </Link>
                    </div>

                    {/* ReCAPTCHA */}
                    <div className="flex justify-center transform scale-90 origin-center -my-2">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <span className="relative bg-white px-4 text-xs text-gray-400">Or sign in with</span>
                    </div>

                    {/* Social Login */}
                    <button
                        type="button"
                        onClick={handleGoogleSignin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.23 9.21 3.24l6.85-6.85C35.9 2.09 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l7.98 6.19C12.43 13.27 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.21-.43-4.74H24v9h12.45c-.54 2.9-2.18 5.36-4.64 7.04l7.13 5.53C43.9 37.24 46.1 31.45 46.1 24.5z" />
                            <path fill="#FBBC05" d="M10.54 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.9-2.14 15.87-5.8l-7.13-5.53c-1.98 1.33-4.51 2.12-8.74 2.12-6.26 0-11.57-3.77-13.46-8.91l-7.98 6.19C6.48 42.62 14.62 48 24 48z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Google</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
