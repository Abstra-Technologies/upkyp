"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { Suspense, useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import { formatCurrency } from "@/utils/formatter/formatters";
import { ADD_ON_SERVICES } from "@/constant/subscription/addOns";

function SubscriptionReview() {
    let initialAddOns: any[] = [];
    const router = useRouter();
    const params = useSearchParams();
    const { user, fetchSession, isHydrated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAddOns, setSelectedAddOns] = useState(initialAddOns);

    const planId = params.get("planId");
    const proratedAmount = Number(params.get("prorated") || 0);
    const bandIndex = params.get("bandIndex");

    useEffect(() => {
        if (!isHydrated) return;
        
        if (!user?.landlord_id) {
            localStorage.setItem("pendingPlan", JSON.stringify({
                planId,
                amount: proratedAmount,
                prorated: proratedAmount,
                addons: "[]"
            }));
            router.push("/auth/login");
            return;
        }
        setIsLoading(false);
    }, [user, isHydrated, router, planId, proratedAmount]);

    try {
        initialAddOns = JSON.parse(params.get("addons") || "[]");
    } catch {
        initialAddOns = [];
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find(
        (p) => String(p.id) === String(planId)
    );

    if (isLoading || !isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!selectedPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Invalid subscription request.</p>
                    <button 
                        onClick={() => router.push('/public/pricing')}
                        className="text-blue-600 hover:underline"
                    >
                        Go to Pricing
                    </button>
                </div>
            </div>
        );
    }

    const basePrice = selectedPlan.unitBands && bandIndex !== null
        ? selectedPlan.unitBands[parseInt(bandIndex)].monthlyPrice
        : selectedPlan.price;


    const toggleAddOn = (addon: any) => {
        const exists = selectedAddOns.some((a) => a.id === addon.id);
        setSelectedAddOns(
            exists
                ? selectedAddOns.filter((a) => a.id !== addon.id)
                : [...selectedAddOns, addon]
        );
    };

    const proratedDiscount = basePrice - proratedAmount;
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const finalTotal = proratedAmount + addOnTotal;

    const goToPayment = async () => {
        if (!user) return;

        try {
            const response = await axios.post("/api/payment/checkout-payment", {
                amount: finalTotal,
                description: selectedPlan.name,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name: selectedPlan.name,
                addons: selectedAddOns,
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

    const displayBand = selectedPlan.unitBands && bandIndex !== null
        ? selectedPlan.unitBands[parseInt(bandIndex)].range
        : null;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">

                <button
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                    onClick={() => router.back()}
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
                                {selectedPlan.name}
                            </h2>
                            {displayBand && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Unit range: {displayBand} units
                                </p>
                            )}

                            <div className="space-y-3 text-gray-700">
                                <div className="flex justify-between">
                                    <span>Base Price</span>
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
                                    <span>Plan Subtotal</span>
                                    <span>
                                        {formatCurrency(proratedAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow border p-6">
                            <h2 className="text-xl font-bold mb-4">Add-ons</h2>

                            <div className="space-y-4">
                                {ADD_ON_SERVICES.map((addon) => {
                                    const selected = selectedAddOns.some(
                                        (a) => a.id === addon.id
                                    );

                                    return (
                                        <div
                                            key={addon.id}
                                            onClick={() => toggleAddOn(addon)}
                                            className={`flex justify-between border rounded-lg p-4 cursor-pointer
                                                ${
                                                selected
                                                    ? "bg-blue-50 border-blue-300"
                                                    : "bg-gray-50"
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {addon.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {addon.description}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {formatCurrency(addon.price)}
                                                </p>
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    className="mt-2 h-5 w-5 accent-blue-600"
                                                    onChange={() => toggleAddOn(addon)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="flex justify-between font-semibold border-t pt-3">
                                    <span>Add-ons Subtotal</span>
                                    <span>{formatCurrency(addOnTotal)}</span>
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
                                <span>Base Plan</span>
                                <span>{formatCurrency(basePrice)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Add-ons</span>
                                <span>{formatCurrency(addOnTotal)}</span>
                            </div>

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
    return (
        <Suspense fallback={<div>Loading…</div>}>
            <SubscriptionReview />
        </Suspense>
    );
}