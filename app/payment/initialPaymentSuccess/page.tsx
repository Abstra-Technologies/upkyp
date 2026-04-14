"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import * as htmlToImage from "html-to-image";
import axios from "axios";

import {
    CheckCircleIcon,
    ArrowLeftIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/* PAGE EXPORT (Suspense wrapper REQUIRED) */
/* ------------------------------------------------------------------ */
export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-500">Loading payment status…</p>
                </div>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    );
}

/* ------------------------------------------------------------------ */
/* INNER COMPONENT (same file, uses useSearchParams) */
/* ------------------------------------------------------------------ */
function PaymentSuccessContent() {
    const params = useSearchParams();
    const router = useRouter();

    const agreement_id = params.get("agreement_id");
    const invoice_id = params.get("invoice_id");
    const payment_type = params.get("type");
    const amount = params.get("amount");

    const receiptRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(
        "Waiting for payment confirmation…"
    );

    /* -------------------- POLL PAYMENT STATUS -------------------- */
    useEffect(() => {
        if (!agreement_id || !payment_type) {
            setLoading(false);
            setMessage("Missing payment information.");
            return;
        }

        let attempts = 0;
        const maxAttempts = 20;
        let interval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const res = await axios.get(
                    `/api/tenant/payment/xendit/initialPayment?agreement_id=${agreement_id}&type=${payment_type}`
                );

                if (res.data.payment?.status === "paid") {
                    setLoading(false);
                    setMessage("Payment confirmed successfully.");
                    clearInterval(interval);
                    return;
                }

                attempts++;
                if (attempts >= maxAttempts) {
                    setLoading(false);
                    setMessage(
                        "Payment is being verified. You may safely return later."
                    );
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Status check failed:", err);
            }
        };

        interval = setInterval(checkStatus, 3000);
        checkStatus();

        return () => clearInterval(interval);
    }, [agreement_id, payment_type]);

    /* -------------------- DOWNLOAD RECEIPT -------------------- */
    const downloadPNG = async () => {
        if (!receiptRef.current) return;

        const dataUrl = await htmlToImage.toPng(receiptRef.current, {
            cacheBust: true,
            pixelRatio: 2,
        });

        const link = document.createElement("a");
        link.download = `Receipt-${agreement_id}.png`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

            {/* STATUS ICON */}
            <div className="mb-5">
                {loading ? (
                    <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg
                            className="animate-spin w-10 h-10 text-yellow-500"
                            viewBox="0 0 24 24"
                            fill="none"
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
                    </div>
                ) : (
                    <CheckCircleIcon className="w-20 h-20 text-emerald-600" />
                )}
            </div>

            {/* TITLE */}
            <h1
                className={`text-2xl font-bold ${
                    loading ? "text-yellow-600" : "text-emerald-600"
                }`}
            >
                {loading ? "Processing Payment" : "Payment Confirmed"}
            </h1>

            <p className="mt-2 text-gray-600 max-w-md text-center">
                {message}
            </p>

            {/* RECEIPT */}
            {!loading && (
                <div
                    ref={receiptRef}
                    className="mt-6 bg-white border rounded-xl shadow-sm p-4 w-full max-w-md"
                >
                    <h2 className="font-semibold text-gray-800 mb-3 text-left">
                        Payment Receipt
                    </h2>

                    <div className="space-y-2 text-sm text-left">
                        <p><strong>Agreement ID:</strong> {agreement_id}</p>
                        <p><strong>Invoice ID:</strong> {invoice_id ?? "—"}</p>
                        <p><strong>Payment Type:</strong> {payment_type}</p>
                        <p><strong>Amount:</strong> ₱{amount}</p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span className="text-emerald-600 font-semibold">
                Confirmed
              </span>
                        </p>
                        <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* ACTIONS */}
            <div className="mt-6 w-full max-w-md space-y-3">
                <button
                    onClick={downloadPNG}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold
          flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download Receipt
                </button>

                <button
                    onClick={() =>
                        router.push(`/pages/tenant/initialPayment/${agreement_id}`)
                    }
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg
          font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Payments
                </button>
            </div>
        </div>
    );
}
