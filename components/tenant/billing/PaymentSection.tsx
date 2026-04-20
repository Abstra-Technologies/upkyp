"use client";

import React, { useState } from "react";
import {
    CreditCardIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useXenditPayment } from "@/hooks/payments/useXenditPayment";

interface PaymentSectionProps {
    bill: any;
    totalDue: number;
    agreement_id: number;
}

export default function PaymentSection({
                                           bill,
                                           totalDue,
                                           agreement_id,
                                       }: PaymentSectionProps) {
    const router = useRouter();
    const { payWithXendit, loadingPayment } = useXenditPayment();

    const [downloading, setDownloading] = useState(false);

    const isPaid = bill?.status === "paid";

    /* -------------------- PROOF OF PAYMENT -------------------- */
    const handleUploadProof = () => {
        router.push(
            `/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${totalDue}&billingId=${bill.billing_id}`
        );
    };

    /* -------------------- DOWNLOAD BILLING PDF -------------------- */
    const handleDownloadPdf = async () => {
        try {
            setDownloading(true);

            const res = await fetch(
                `/api/tenant/billing/${bill.billing_id}`
            );

            if (!res.ok) throw new Error("Failed to generate PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `billing-${bill.billing_id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Failed to download billing PDF.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-4 border-t space-y-3">
            {/* ================= PAID STATE ================= */}
            {isPaid && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-semibold text-green-700">
                            This bill has been fully paid
                        </p>
                        <p className="text-sm text-green-600">
                            No further action is required.
                        </p>
                    </div>
                </div>
            )}

            {/* ================= PAYMENT ACTIONS ================= */}
            {!isPaid && (
                <>
                    {/* Pay with Xendit */}
                    <button
                        onClick={() =>
                            payWithXendit({
                                billing_id: bill.billing_id,
                                amount: totalDue,
                            })
                        }
                        disabled={loadingPayment}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3
                        bg-gradient-to-r from-blue-600 to-emerald-600
                        hover:from-blue-700 hover:to-emerald-700
                        text-white rounded-xl font-bold shadow-md
                        hover:shadow-lg transition-all duration-200
                        disabled:opacity-50"
                    >
                        {loadingPayment ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <CreditCardIcon className="w-5 h-5" />
                                <span>Pay Bill</span>
                            </>
                        )}
                    </button>

                    {/* Upload Proof of Payment */}
                    <button
                        onClick={handleUploadProof}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3
                        bg-white border-2 border-gray-200
                        hover:border-blue-300 hover:bg-blue-50
                        text-gray-700 rounded-xl font-bold shadow-sm transition-all"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Upload Proof of Payment</span>
                    </button>
                </>
            )}

            {/* ================= DOWNLOAD BILLING ================= */}
            {!bill?.isDefaultBilling && (
                <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className={`
                        w-full flex items-center justify-center gap-2 px-4 py-3
                        rounded-xl font-bold shadow-sm transition-all
                        ${
                        downloading
                            ? "bg-emerald-50 text-emerald-600 cursor-not-allowed"
                            : "bg-white border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700"
                    }
                    `}
                >
                    {downloading ? (
                        <>
                            <svg
                                className="w-5 h-5 animate-spin text-emerald-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                            <span className="animate-pulse">
                                Preparing document…
                            </span>
                        </>
                    ) : (
                        <>
                            <DocumentArrowDownIcon className="w-5 h-5" />
                            <span>Download Billing PDF</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
