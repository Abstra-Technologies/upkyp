"use client";

import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
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
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    const selectedPlanDetails = SUBSCRIPTION_PLANS.find(
        (p) => p.id === selectedPlan.id
    );

    if (!selectedPlanDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Invalid subscription request.</p>
                    <button 
                        onClick={() => {
                            clearSelectedPlan();
                            router.push('/public/pricing');
                        }}
                        className="text-blue-600 hover:underline"
                    >
                        Go to Pricing
                    </button>
                </div>
            </div>
        );
    }

    const displayBand = selectedPlan.unitBandIndex !== undefined && selectedPlan.unitBandIndex !== null && selectedPlanDetails.unitBands
        ? selectedPlanDetails.unitBands[selectedPlan.unitBandIndex]?.range
        : null;

    const basePrice = selectedPlan.price || 0;
    const proratedAmount = selectedPlan.proratedAmount || basePrice;
    const proratedDiscount = basePrice - proratedAmount;
    const finalTotal = proratedAmount;

    const goToPayment = async () => {
        if (!user) return;

        try {
            const response = await axios.post("/api/payment/checkout-payment", {
                amount: finalTotal,
                description: selectedPlanDetails.name,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name: selectedPlanDetails.name,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
                },
            });

            if (response.data?.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                alert("Payment Error: No checkout URL received.");
            }
        } catch {
            alert("Unable to start payment.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">

                <button
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                    onClick={() => {
                        router.back();
                    }}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>

                <h1 className="text-3xl font-bold mb-8">
                    Subscription Checkout
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-6">

                        <div className="bg-white rounded-xl shadow border p-6">
                            <h2 className="text-xl font-bold mb-2">
                                {selectedPlanDetails.name}
                            </h2>
                            {displayBand && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Unit range: {displayBand} units
                                </p>
                            )}

                            <div className="space-y-3 text-gray-700">
                                <div className="flex justify-between">
                                    <span>Plan Price</span>
                                    <span className="font-semibold">
                                        {formatCurrency(basePrice)}
                                    </span>
                                </div>

                                {proratedDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Prorated Discount</span>
                                        <span>
                                            - {formatCurrency(proratedDiscount)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between font-bold pt-2">
                                    <span>Total Due</span>
                                    <span>
                                        {formatCurrency(proratedAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-xl border p-6 h-fit">
                        <h3 className="text-lg font-bold mb-4">
                            Order Summary
                        </h3>

                        <div className="space-y-4 text-gray-700">
                            <div className="flex justify-between">
                                <span>Plan</span>
                                <span>{selectedPlanDetails.name}</span>
                            </div>

                            {displayBand && (
                                <div className="flex justify-between">
                                    <span>Unit Range</span>
                                    <span>{displayBand}</span>
                                </div>
                            )}

                            <hr />

                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(basePrice)}</span>
                            </div>

                            {proratedDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Prorated Credit</span>
                                    <span>-{formatCurrency(proratedDiscount)}</span>
                                </div>
                            )}

                            <hr />

                            <div className="flex justify-between text-xl font-bold">
                                <span>Total Due Today</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={goToPayment}
                            className="w-full mt-6 py-3 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700"
                        >
                            Pay Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return <SubscriptionReview />;
}