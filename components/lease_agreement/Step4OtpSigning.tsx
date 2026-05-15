"use client";

import { CheckCircle2, Mail, ShieldCheck, Loader2 } from "lucide-react";

interface Props {
    leaseFileUrl: string;
    email: string;
    otpSent: boolean;
    otpCode: string;
    cooldown: number;
    resending: boolean;
    sending?: boolean;
    onSendOtp: () => void;
    onVerify: () => void;
    onResend: () => void;
    onOtpChange: (v: string) => void;
}

export default function Step4OtpSigning({
                                            leaseFileUrl,
                                            email,
                                            otpSent,
                                            otpCode,
                                            cooldown,
                                            resending,
                                            sending = false,
                                            onSendOtp,
                                            onVerify,
                                            onResend,
                                            onOtpChange,
                                        }: Props) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-2xl mx-auto text-center">
            {/* Header */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex justify-center items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Lease Ready for Verification
            </h2>

            <p className="text-sm text-gray-600 mb-5">
                Review the lease document below. To proceed, verify your identity
                using a one-time password (OTP).
            </p>

            {/* Lease Preview */}
            <div className="mb-5 border rounded-lg overflow-hidden">
                <iframe
                    src={leaseFileUrl}
                    className="w-full h-[480px]"
                    title="Lease Document Preview"
                />
            </div>

            {/* OTP Section */}
            {!otpSent ? (
                <div className="mt-4">
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        OTP will be sent to <strong>{email}</strong>
                    </div>

                    <button
                        onClick={onSendOtp}
                        disabled={sending}
                        className="px-6 py-3 rounded-lg font-semibold text-white
                                   bg-gradient-to-r from-blue-600 to-emerald-600
                                   hover:from-blue-700 hover:to-emerald-700
                                   disabled:from-gray-400 disabled:to-gray-500
                                   transition flex items-center gap-2 min-w-[140px] justify-center"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                            </>
                        ) : (
                            "Send OTP"
                        )}
                    </button>
                </div>
            ) : (
                <div className="mt-6">
                    <div className="flex justify-center mb-3">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Enter the 6-digit verification code sent to your email.
                    </p>

                    {/* OTP Input */}
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) =>
                            onOtpChange(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••••"
                        className="
                            w-48 mx-auto text-center text-2xl tracking-widest
                            border border-gray-300 rounded-lg p-3 mb-4
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        "
                    />

                    {/* Verify Button */}
                    <button
                        onClick={onVerify}
                        disabled={otpCode.length !== 6}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition
                            ${
                            otpCode.length === 6
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                                : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        Verify & Continue
                    </button>

                    {/* Resend */}
                    <div className="mt-4 text-sm text-gray-600">
                        <button
                            onClick={onResend}
                            disabled={cooldown > 0}
                            className="text-blue-600 hover:underline disabled:text-gray-400"
                        >
                            {resending
                                ? "Resending…"
                                : cooldown > 0
                                    ? `Resend OTP in ${cooldown}s`
                                    : "Resend OTP"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
