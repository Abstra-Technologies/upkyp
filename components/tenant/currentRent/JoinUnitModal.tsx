"use client";

import { useState, useRef, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Loader2, KeyRound } from "lucide-react";

interface JoinUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoined: () => void;
}

export default function JoinUnitModal({ isOpen, onClose, onJoined }: JoinUnitModalProps) {
    const [code, setCode] = useState(["", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setCode(["", "", "", ""]);
            setError(null);
            setSuccess(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        if (!/^[a-zA-Z0-9]*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1).toUpperCase();
        setCode(newCode);
        setError(null);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
        if (pasted.length === 4) {
            const newCode = pasted.split("");
            setCode(newCode);
            inputRefs.current[3]?.focus();
        }
    };

    const joinUnit = async () => {
        const inviteCode = code.join("");
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/tenant/join-unit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: inviteCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to join unit");
                return;
            }

            setSuccess(true);
            onJoined();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
                onClick={handleClose}
            />

            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div
                    className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {success ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h2>
                            <p className="text-gray-600 mb-6">You have successfully joined your unit</p>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <KeyRound className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Join Unit</h2>
                                        <p className="text-xs text-white/80">Enter your 4-character invite code from your landlord</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-all disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs text-amber-800">
                                        <span className="font-semibold">Need a code?</span> Ask your landlord for the 4-character invite code.
                                    </p>
                                </div>

                                <div className="flex justify-center gap-3" onPaste={handlePaste}>
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            disabled={loading || success}
                                            className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none focus:ring-4
                                                ${error
                                                    ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                                                }
                                                disabled:opacity-50 disabled:cursor-not-allowed`}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-xl">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={joinUnit}
                                    disabled={loading || code.some((d) => !d)}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Joining...</span>
                                        </>
                                    ) : (
                                        "Join Unit"
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
