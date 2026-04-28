"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import { formatCurrency } from "@/utils/formatter/formatters";
import { useSubscriptionStore } from "@/zustand/subscriptionStore";

function SubscriptionReview() {
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();
    const { selectedPlan, clearSelectedPlan } = useSubscriptionStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isHydrated) return;
        
        if (!selectedPlan) {
            router.push('/public/pricing');
            return;
        }

        if (!user?.landlord_id) {
            router.push("/auth/login");
            return;
        }
        
        setIsLoading(false);
    }, [isHydrated, user, selectedPlan, router]);

    if (isLoading || !isHydrated || !selectedPlan) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    const basePrice = selectedPlan.price || 0;
    const proratedAmount = selectedPlan.proratedAmount || basePrice;
    const proratedDiscount = basePrice - proratedAmount;
    const finalTotal = proratedAmount;

    const goToPayment = async () => {
        if (!user || isProcessing) return;

        setIsProcessing(true);
        try {
            const response = await axios.post("/api/payment/checkout-payment", {
                amount: finalTotal,
                description: selectedPlan.name,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_id: selectedPlan.id,
                plan_name: selectedPlan.name,
                plan_code: selectedPlan.planCode,
                unit_band_index: selectedPlan.unitBandIndex,
                band_range: selectedPlan.bandRange,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
                },
            });

            if (response.status === 201) {
                alert(`Free trial activated! Your trial ends on ${response.data.trialEndDate}`);
                router.push("/landlord/dashboard");
                return;
            }

            if (response.data?.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                alert("Payment Error: No checkout URL received.");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Unable to start payment.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        className="flex items-center text-gray-500 hover:text-gray-800 transition"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pricing
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Review Your Subscription
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Confirm your plan details and proceed to payment
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left - Plan Details */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Plan Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                <h2 className="text-lg font-bold text-white">
                                    {selectedPlan.name} Plan
                                </h2>
                                {selectedPlan.bandRange && (
                                    <p className="text-sm text-blue-100 mt-1">
                                        {selectedPlan.bandRange} units
                                    </p>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Plan Price</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(basePrice)}
                                        </span>
                                    </div>

                                    {proratedDiscount > 0 && (
                                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <span className="text-green-600">Prorated Discount</span>
                                            <span className="font-semibold text-green-600">
                                                -{formatCurrency(proratedDiscount)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-lg font-bold text-gray-900">Total Due</span>
                                        <span className="text-2xl font-extrabold text-gray-900">
                                            {formatCurrency(proratedAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What's Included */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4">What's Included</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    Property & unit management
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    Financial tracking & reports
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    Tenant & lease management
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right - Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-6">
                            <h3 className="font-bold text-gray-900 mb-6">Order Summary</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Plan</span>
                                    <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                                </div>

                                {selectedPlan.bandRange && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Unit Range</span>
                                        <span className="font-medium text-gray-900">{selectedPlan.bandRange}</span>
                                    </div>
                                )}

                                <hr className="border-gray-100" />

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900">{formatCurrency(basePrice)}</span>
                                </div>

                                {proratedDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Prorated Credit</span>
                                        <span className="text-green-600">-{formatCurrency(proratedDiscount)}</span>
                                    </div>
                                )}

                                <hr className="border-gray-100" />

                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-900">Total Due Today</span>
                                    <span className="text-2xl font-extrabold text-gray-900">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={goToPayment}
                                disabled={isProcessing}
                                className="w-full mt-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    "Pay Now"
                                )}
                            </button>

                            <p className="mt-4 text-xs text-center text-gray-400">
                                Secure payment powered by PayMongo
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return <SubscriptionReview />;
}