"use client";

import { useEffect } from "react";
import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import { validatePassword } from "@/utils/validation/passwordValidation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function MobileRegisterForm() {
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
        <div className="w-full max-w-sm mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">

                {/* Header */}
                <div className="text-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        Create Account
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Register as{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 font-medium">
              {formData.role}
            </span>
                    </p>
                </div>

                {/* Errors */}
                {error && (
                    <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 text-center">{error}</p>
                    </div>
                )}

                {error_2 && (
                    <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 text-center">
                            {decodeURIComponent(error_2)}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>

                    {/* First Name */}
                    <input
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        disabled={isRegistering}
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm"
                    />

                    {/* Last Name */}
                    <input
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        disabled={isRegistering}
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm"
                    />

                    {/* Email */}
                    <input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        disabled={isRegistering}
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm"
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
                            className="w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Password Rules (Mobile-friendly) */}
                    {formData.password && (
                        <div className="space-y-0.5 text-xs p-2.5 bg-gray-50 rounded-lg">
                            <p className={passwordValidation.length ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.length ? "✔" : "✖"} 8+ characters
                            </p>
                            <p className={passwordValidation.uppercase ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.uppercase ? "✔" : "✖"} Uppercase letter
                            </p>
                            <p className={passwordValidation.lowercase ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.lowercase ? "✔" : "✖"} Lowercase letter
                            </p>
                            <p className={passwordValidation.number ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.number ? "✔" : "✖"} Number
                            </p>
                            <p className={passwordValidation.special ? "text-emerald-600" : "text-red-500"}>
                                {passwordValidation.special ? "✔" : "✖"} Special character
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
                            className="w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>

                    {formData.confirmPassword && !passwordsMatch && (
                        <p className="text-red-500 text-xs">
                            Passwords do not match
                        </p>
                    )}

                    {/* Terms */}
                    <label className="flex items-start gap-2 text-xs text-gray-600">
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
              text-white rounded-lg text-sm disabled:opacity-50"
                    >
                        {isRegistering ? "Registering..." : "Create Account"}
                    </button>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        disabled={isRegistering}
                        className="w-full py-2.5 border rounded-lg text-sm"
                    >
                        Sign up with Google
                    </button>
                </form>
            </div>

            <p className="text-center text-sm text-gray-600 mt-5">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
