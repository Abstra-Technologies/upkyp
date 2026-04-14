"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BillFailedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BillFailed />
        </Suspense>
    );
}

function BillFailed() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const amount = searchParams.get("amount");
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const billing_id = searchParams.get("billing_id");
    const agreement_id = searchParams.get("agreement_id");
    const reason = searchParams.get("reason"); // optional (FAILED / EXPIRED)

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Finalizing payment status...");

    useEffect(() => {
        // No API mutation here – webhook already handled it
        setTimeout(() => {
            setMessage(
                reason === "EXPIRED"
                    ? "Your payment session expired. No charges were made."
                    : "Your payment was not completed. Please try again."
            );
            setLoading(false);
        }, 1200);
    }, [reason]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
                {/* Icon */}
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
                    {loading ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="animate-spin w-10 h-10 text-yellow-500"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="opacity-25"
                            />
                            <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                                className="opacity-75"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-10 h-10 text-red-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    )}
                </div>

                {/* Title */}
                <h2
                    className={`text-2xl font-extrabold mb-2 ${
                        loading ? "text-yellow-600" : "text-red-600"
                    }`}
                >
                    {loading ? "Processing..." : "Payment Failed"}
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-sm mb-6">{message}</p>

                {/* Receipt-style summary */}
                {!loading && (
                    <div className="mt-4 text-left bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-center text-lg font-bold text-gray-800 mb-3">
                            Payment Attempt Summary
                        </h3>

                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <strong>Reference No:</strong>{" "}
                                <span>{requestReferenceNumber || "—"}</span>
                            </p>

                            <p>
                                <strong>Bill ID:</strong>{" "}
                                <span>{billing_id || "—"}</span>
                            </p>

                            <p>
                                <strong>Date:</strong>{" "}
                                <span>{new Date().toLocaleString()}</span>
                            </p>

                            <p>
                                <strong>Amount:</strong>{" "}
                                <span className="font-semibold">
                  ₱{parseFloat(amount || "0").toLocaleString()}
                </span>
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                <span className="text-red-600 font-semibold">
                  Failed
                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="my-6 border-t border-gray-200" />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() =>
                            router.replace(
                                `/pages/tenant/billing/pay?billing_id=${billing_id}`
                            )
                        }
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg
              border border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                        Retry Payment
                    </button>

                    <button
                        onClick={() =>
                            router.replace(
                                `/pages/tenant/rentalPortal/${agreement_id}`
                            )
                        }
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg
              bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow
              hover:from-gray-800 hover:to-gray-900 transition-all duration-200"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
