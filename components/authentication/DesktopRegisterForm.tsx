"use client";

import { useEffect } from "react";
import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import { validatePassword } from "@/utils/validation/passwordValidation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function DesktopRegisterForm() {
    const {
        formData,
        errors,
        error,
        error_2,
        agreeToTerms,
        handleCheckboxChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isRegistering,
        handleChange,
        handleGoogleSignup,
        handleSubmit,
        setTimezone,
    } = useRegisterForm();

    /* ================= TIMEZONE ================= */
    useEffect(() => {
        let tz =
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

        if (tz === "Asia/Singapore") tz = "Asia/Manila";

        setTimezone(tz);
    }, [setTimezone]);

    const passwordValidation = validatePassword(formData.password);
    const passwordsMatch =
        formData.password &&
        formData.password === formData.confirmPassword;

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        Register as{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              {formData.role}
            </span>
                    </h2>
                </div>

                {/* Errors */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700 text-center">{error}</p>
                    </div>
                )}

                {error_2 && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700 text-center">
                            {decodeURIComponent(error_2)}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                    {/* Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            id="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            disabled={isRegistering}
                            className="w-full px-4 py-2.5 border rounded-lg"
                        />
                        <input
                            id="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            disabled={isRegistering}
                            className="w-full px-4 py-2.5 border rounded-lg"
                        />
                    </div>

                    {/* Email */}
                    <input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        disabled={isRegistering}
                        className="w-full px-4 py-2.5 border rounded-lg"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs">{errors.email}</p>
                    )}

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            disabled={isRegistering}
                            className="w-full px-4 py-2.5 pr-10 border rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Password rules */}
                    {formData.password && (
                        <div className="text-xs space-y-1 p-3 bg-gray-50 rounded-lg">
                            <p className={passwordValidation.length ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.length ? "✔" : "✖"} At least 8 characters
                            </p>
                            <p className={passwordValidation.uppercase ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.uppercase ? "✔" : "✖"} One uppercase letter
                            </p>
                            <p className={passwordValidation.lowercase ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.lowercase ? "✔" : "✖"} One lowercase letter
                            </p>
                            <p className={passwordValidation.number ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.number ? "✔" : "✖"} One number
                            </p>
                            <p className={passwordValidation.special ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.special ? "✔" : "✖"} One special character
                            </p>
                        </div>
                    )}

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password"
                            disabled={isRegistering}
                            className="w-full px-4 py-2.5 pr-10 border rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {formData.confirmPassword && !passwordsMatch && (
                        <p className="text-red-500 text-xs">Passwords do not match</p>
                    )}

                    {/* Terms */}
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={handleCheckboxChange}
                            disabled={isRegistering}
                        />
                        I agree to the{" "}
                        <Link href="/terms-services" className="text-blue-600">
                            Terms & Privacy
                        </Link>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={
                            isRegistering ||
                            !agreeToTerms ||
                            !passwordValidation.isStrong ||
                            !passwordsMatch
                        }
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600
              text-white rounded-lg disabled:opacity-50"
                    >
                        {isRegistering ? "Registering..." : "Create Account"}
                    </button>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        disabled={isRegistering}
                        className="w-full py-2.5 border rounded-lg"
                    >
                        Sign up with Google
                    </button>
                </form>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
