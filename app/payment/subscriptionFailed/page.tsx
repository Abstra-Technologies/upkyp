"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { XCircle, LifeBuoy, Home } from "lucide-react";

function SearchParamsWrapper({ setRefNo, setAmount, setPlan, setLandlord }) {
    const searchParams = useSearchParams();
    const refNo = searchParams.get("requestReferenceNumber");
    const amount = searchParams.get("amount");
    const plan = searchParams.get("plan_name");
    const landlord = searchParams.get("landlord_id");

    useEffect(() => {
        if (refNo) setRefNo(refNo);
        if (amount) setAmount(amount);
        if (plan) setPlan(plan);
        if (landlord) setLandlord(landlord);
    }, [refNo, amount, plan, landlord]);

    return null;
}

function PaymentFailedPageContent() {
    const router = useRouter();
    const [refNo, setRefNo] = useState<string | null>(null);
    const [amount, setAmount] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [landlord, setLandlord] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex flex-col items-center justify-center px-6 py-12">
            <SearchParamsWrapper
                setRefNo={setRefNo}
                setAmount={setAmount}
                setPlan={setPlan}
                setLandlord={setLandlord}
            />

            {/* Card Container */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full p-10 text-center overflow-hidden">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 rounded-t-3xl" />

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-100 shadow-inner">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-red-600 mb-2">
                    Payment Failed
                </h1>
                <p className="text-gray-700 leading-relaxed mb-8 text-sm sm:text-base">
                    We couldn’t process your payment for{" "}
                    <span className="font-semibold text-gray-900">
            {plan || "your selected plan"}
          </span>
                    . Please check your payment details or try again. If the amount was
                    already deducted, contact our support team for assistance.
                </p>

                {/* Transaction Info */}
                {(refNo || amount || plan || landlord) && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-gray-800 space-y-3 mb-8 shadow-inner">
                        {plan && (
                            <div className="flex justify-between">
                                <span className="font-semibold">Plan:</span>
                                <span>{plan}</span>
                            </div>
                        )}
                        {amount && (
                            <div className="flex justify-between">
                                <span className="font-semibold">Amount:</span>
                                <span>₱{parseFloat(amount).toFixed(2)}</span>
                            </div>
                        )}
                        {refNo && (
                            <div className="flex justify-between">
                                <span className="font-semibold">Reference No.:</span>
                                <span>{refNo}</span>
                            </div>
                        )}
                        {landlord && (
                            <div className="flex justify-between">
                                <span className="font-semibold">Landlord ID:</span>
                                <span>{landlord}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a
                        href={`mailto:support@upkyp.com?subject=Payment%20Issue%20-%20UpKyp&body=Reference%20Number:%20${refNo || ""}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        <LifeBuoy className="w-5 h-5" />
                        Contact Support
                    </a>

                    <button
                        onClick={() => router.push("/pages/landlord/subscription_plan/pricing")}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Back to Subscription
                    </button>
                </div>
            </div>

            {/* Page_footer */}
            <p className="mt-10 text-gray-500 text-xs text-center">
                Need more help? Reach us anytime at{" "}
                <a
                    href="mailto:support@upkyp.com"
                    className="text-red-600 hover:underline"
                >
                    support@upkyp.com
                </a>
            </p>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense
            fallback={
                <div className="text-center mt-20 text-gray-600 animate-pulse">
                    Loading payment details...
                </div>
            }
        >
            <PaymentFailedPageContent />
        </Suspense>
    );
}
