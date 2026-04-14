"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";

const SearchParamsWrapper = ({
                                 setRequestReferenceNumber,
                                 setLandlordId,
                                 setPlanName,
                                 setAmount,
                             }) => {
    const searchParams = useSearchParams();
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const landlord_id = searchParams.get("landlord_id");
    const plan_name = searchParams.get("plan_name");
    const amount = searchParams.get("amount");

    useEffect(() => {
        if (requestReferenceNumber && landlord_id) {
            setRequestReferenceNumber(requestReferenceNumber);
            setLandlordId(landlord_id);
            setPlanName(plan_name);
            setAmount(amount);
        }
    }, [
        requestReferenceNumber,
        landlord_id,
        plan_name,
        amount,
        setRequestReferenceNumber,
        setLandlordId,
        setPlanName,
        setAmount,
    ]);

    return null;
};

function PaymentCancelledPage() {
    const router = useRouter();
    const [requestReferenceNumber, setRequestReferenceNumber] = useState(null);
    const [landlord_id, setLandlordId] = useState(null);
    const [plan_name, setPlanName] = useState(null);
    const [amount, setAmount] = useState(null);
    const [message, setMessage] = useState("Processing your cancellation...");
    const [loading, setLoading] = useState(true);
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        async function cancelSubscription() {
            if (!requestReferenceNumber || !landlord_id) return;

            try {
                const response = await axios.post("/api/payment/status", {
                    requestReferenceNumber,
                    landlord_id,
                    plan_name: plan_name || "N/A",
                    amount: amount ? parseFloat(amount) : 0,
                    status: "cancelled",
                });

                const planText = plan_name ? `${plan_name} plan` : "your subscription";
                setMessage(
                    response.data.message ||
                    `Your payment for ${planText} was cancelled successfully.`
                );

                setIsCancelled(true);
            } catch (error: any) {
                setMessage(
                    "We couldn’t log your cancellation. Please contact support if payment was credited."
                );
            } finally {
                setLoading(false);
            }
        }

        cancelSubscription();
    }, [requestReferenceNumber, landlord_id, plan_name, amount]);

    return (
        <Suspense fallback={<div>Loading cancellation details...</div>}>
            <SearchParamsWrapper
                setRequestReferenceNumber={setRequestReferenceNumber}
                setLandlordId={setLandlordId}
                setPlanName={setPlanName}
                setAmount={setAmount}
            />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 px-4 py-10">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center relative overflow-hidden">
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-400 to-blue-500"></div>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100 shadow-inner">
                            <svg
                                className="w-10 h-10 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Payment Cancelled
                    </h2>

                    {/* Message */}
                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        {loading
                            ? "We’re confirming your cancellation..."
                            : message ||
                            "Your payment was cancelled before completion. No charges were made."}
                    </p>

                    {/* Action */}
                    <div className="mt-6">
                        {isCancelled ? (
                            <button
                                onClick={() =>
                                    router.push("/pages/landlord/subsciption_plan/pricing")
                                }
                                className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition-all duration-300"
                            >
                                Back to Subscription Plans
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-gray-600 bg-gray-100 cursor-not-allowed"
                            >
                                Cancelling...
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default PaymentCancelledPage;
