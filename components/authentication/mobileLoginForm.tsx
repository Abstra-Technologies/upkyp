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
        <div className="w-full max-w-[380px] mx-auto bg-white min-h-screen flex flex-col relative overflow-hidden">
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-20 top-1/4 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute -left-20 bottom-1/4 w-64 h-64 bg-purple-100/40 rounded-full blur-3xl" />
                {/* Subtle wave pattern */}
                <svg className="absolute bottom-0 left-0 w-full opacity-5" viewBox="0 0 400 400" fill="none">
                    <path d="M0 400C100 350 200 300 300 350C350 375 400 400 400 400V0H0V400Z" fill="url(#grad1)" />
                    <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="400" y2="400">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-12">
                {/* Logo */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Upkyp
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-1 tracking-widest uppercase">Property Management</p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 w-full">
                        <p className="text-xs text-red-600 text-center font-medium">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            disabled={isLoggingIn}
                            className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400 bg-white"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            disabled={isLoggingIn}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 transition-all placeholder:text-gray-400 bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoggingIn}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoggingIn || !captchaToken}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-full text-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25"
                    >
                        {isLoggingIn ? "Signing in..." : "Log in"}
                    </button>

                    {/* Forgot Password */}
                    <div className="text-center">
                        <Link href="./forgot-password" className="text-xs text-gray-500 font-medium hover:text-gray-700 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    {/* ReCAPTCHA */}
                    <div className="flex justify-center transform scale-85 origin-center -my-2">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token: string | null) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <span className="relative bg-white px-4 text-[10px] text-gray-400">Or sign in with</span>
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleSignin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-full text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.23 9.21 3.24l6.85-6.85C35.9 2.09 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l7.98 6.19C12.43 13.27 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.21-.43-4.74H24v9h12.45c-.54 2.9-2.18 5.36-4.64 7.04l7.13 5.53C43.9 37.24 46.1 31.45 46.1 24.5z" />
                            <path fill="#FBBC05" d="M10.54 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.9-2.14 15.87-5.8l-7.13-5.53c-1.98 1.33-4.51 2.12-8.74 2.12-6.26 0-11.57-3.77-13.46-8.91l-7.98 6.19C6.48 42.62 14.62 48 24 48z" />
                        </svg>
                        Login with Google
                    </button>

                    {/* Sign Up Link */}
                    <div className="text-center mt-4">
                        <p className="text-xs text-gray-500">
                            Don't have an account yet?{" "}
                            <Link href="/auth/selectRole" className="text-blue-600 font-semibold hover:text-blue-700">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
