"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import html2canvas from "html2canvas";

export default function SecSucceedPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <SecSuccess />
        </Suspense>
    );
}

function SecSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const billing_id = searchParams.get("billing_id");

    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [status, setStatus] = useState<string | null>(null);

    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchPayment() {
            if (!billing_id) return;

            try {
                const res = await axios.get(
                    `/api/tenant/payment/xendit/status?billing_id=${billing_id}`
                );

                setPaymentData(res.data.payment);
                setStatus(res.data.status);
            } catch (err) {
                console.error("Payment fetch error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPayment();
    }, [billing_id]);

    const handleDownloadImage = async () => {
        if (!receiptRef.current) return;

        const canvas = await html2canvas(receiptRef.current, {
            scale: 3,
            backgroundColor: "#ffffff",
        });

        const link = document.createElement("a");
        link.download = `Upkyp_Receipt_${paymentData?.receipt_reference || paymentData?.payment_id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Processing payment...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
            <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8">

                {status === "confirmed" && paymentData && (
                    <div
                        ref={receiptRef}
                        className="bg-white border border-gray-200 rounded-xl p-8 space-y-6"
                    >
                        {/* Header */}
                        <div className="text-center border-b pb-6">
                            <h1 className="text-2xl font-bold tracking-wide">
                               Upkyp
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Official Payment Receipt
                            </p>
                        </div>

                        {/* Receipt Details */}
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <span className="text-gray-500">Receipt No.</span>
                            <span className="text-right font-medium">
                {paymentData.receipt_reference ||
                    `RCPT-${paymentData.payment_id}`}
              </span>

                            <span className="text-gray-500">Billing ID</span>
                            <span className="text-right font-medium">
                {paymentData.bill_id}
              </span>

                            <span className="text-gray-500">Gateway Payment Reference</span>
                            <span className="text-right font-medium">
                {paymentData.gateway_transaction_ref}
              </span>

                            <span className="text-gray-500">Property</span>
                            <span className="text-right font-medium">
                {paymentData.property_name}
              </span>

                            <span className="text-gray-500">Unit</span>
                            <span className="text-right font-medium">
                {paymentData.unit_name}
              </span>

                            <span className="text-gray-500">Billing Period</span>
                            <span className="text-right font-medium">
                {new Date(paymentData.billing_period).toLocaleDateString(
                    "en-PH",
                    { month: "long", year: "numeric" }
                )}
              </span>

                            <span className="text-gray-500">Payment Date</span>
                            <span className="text-right font-medium">
                {new Date(paymentData.payment_date).toLocaleString()}
              </span>
                        </div>

                        {/* Amount */}
                        <div className="border-t pt-6 text-center">
                            <p className="text-gray-500 text-sm">Total Amount Paid</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                ₱
                                {Number(paymentData.amount_paid).toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                })}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-400 pt-6 border-t">
                            This receipt confirms that your payment has been successfully
                            received. Thank you for your prompt payment.
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={handleDownloadImage}
                        className="bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition"
                    >
                        Download Receipt
                    </button>

                    <button
                        onClick={() =>
                            router.replace(
                                `/pages/tenant/rentalPortal/${paymentData?.agreement_id}/billing?agreement_id=${paymentData?.agreement_id}`
                            )
                        }
                        className="border py-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                        Back to Billing
                    </button>
                </div>
            </div>
        </div>
    );
}