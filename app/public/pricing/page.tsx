"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS, UNIT_BANDS } from "@/constant/subscription/subscriptionPlans";
import { Check, ChevronDown } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";

export default function PricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { currentSubscription, loading } = useSubscriptionData();

    const [selectedBand, setSelectedBand] = useState<Record<number, string>>({});

    const handleSelectPlan = (plan: any) => {
        const bandIndex = selectedBand[plan.id] ?? "0";
        const amount = plan.unitBands 
            ? plan.unitBands[parseInt(bandIndex)]?.monthlyPrice ?? plan.price
            : plan.price;
        
        const intendedUrl = `/landlord/subsciption_plan/payment/review?planId=${plan.id}&amount=${amount}&prorated=${amount}&addons=${encodeURIComponent("[]")}&band=${bandIndex}`;

        const params = new URLSearchParams(window.location.search);
        const existingCallback = params.get("callbackUrl");

        const finalCallback = existingCallback || intendedUrl;

        if (!user) {
            router.push(`/auth/login?callbackUrl=${encodeURIComponent(finalCallback)}`);
            return;
        }

        router.push(finalCallback);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-12 md:px-6 md:py-16">
            <section className="max-w-5xl mx-auto text-center mb-10 md:mb-14">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
                    Simple, Transparent Pricing
                </h1>
                <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
                    Built for independent landlords, property managers, and growing portfolios.
                </p>
            </section>

            {/* Show current subscription banner if user is logged in */}
            {!loading && user && currentSubscription && (
                <div className="max-w-6xl mx-auto mb-8">
                    <CurrentSubscriptionBanner currentSubscription={currentSubscription} />
                </div>
            )}

            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isEnterprise = plan.name === "Enterprise Plan";
                    const hasUnitBands = plan.unitBands && plan.unitBands.length > 0;
                    const currentBandIndex = selectedBand[plan.id] ?? "0";
                    const currentBand = hasUnitBands && plan.unitBands ? plan.unitBands[parseInt(currentBandIndex)] : null;
                    const displayPrice = currentBand ? currentBand.monthlyPrice : plan.price;

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-xl border bg-white shadow-sm transition hover:shadow-md
                                ${currentSubscription?.plan_name === plan.name 
                                    ? "ring-2 ring-green-500 border-green-500" 
                                    : plan.popular 
                                        ? "border-blue-500 ring-1 ring-blue-500" 
                                        : "border-gray-200"}
                            `}
                        >
                            {currentSubscription?.plan_name === plan.name ? (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                                    Current Plan
                                </div>
                            ) : plan.popular ? (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                                    Popular
                                </div>
                            ) : null}

                            <div className="p-4 sm:p-5 flex flex-col flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    {plan.name}
                                </h3>

                                <div className="mt-3">
                                    {isEnterprise ? (
                                        <p className="text-2xl font-extrabold text-gray-900">
                                            Custom
                                        </p>
                                    ) : (
                                        <p className="text-2xl font-extrabold text-gray-900">
                                            ₱{displayPrice.toLocaleString()}
                                            <span className="text-sm font-medium text-gray-500">
                                                {displayPrice > 0 && "/mo"}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Unit Band Dropdown */}
                                {hasUnitBands && (
                                    <div className="mt-3">
                                        <select
                                            value={currentBandIndex}
                                            onChange={(e) =>
                                                setSelectedBand({ ...selectedBand, [plan.id]: e.target.value })
                                            }
                                            className="
            w-full
            rounded-xl
            px-3 py-2
            text-xs sm:text-sm

            bg-gray-100
            border border-gray-300

            text-gray-800
            shadow-sm

            transition-all duration-200

            hover:bg-gray-50
            focus:outline-none
            focus:ring-2 focus:ring-blue-400/30
            focus:border-blue-400
        "
                                        >
                                            {plan.unitBands?.map((band: any, idx: number) => (
                                                <option key={idx} value={String(idx)}>
                                                    {band.range} - ₱{band.monthlyPrice.toLocaleString()}/mo
                                                </option>
                                            ))}
                                        </select>
                                    </div>                                )}

                                <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-700">
                                    {plan.features.slice(0, 5).map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{feature}</span>
                                        </li>
                                    ))}
                                    {plan.features.length > 5 && (
                                        <li className="text-xs text-gray-500">
                                            +{plan.features.length - 5} more features
                                        </li>
                                    )}
                                </ul>

                                {!isEnterprise && plan.price > 0 && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Fee:</span>
                                            <span className="font-semibold">{plan.transactionFeeRate}%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    {isEnterprise ? (
                                        <Link
                                            href="/contact-sales"
                                            className="block w-full rounded-lg bg-gray-900 px-3 py-2.5 text-center text-xs sm:text-sm font-semibold text-white hover:bg-gray-800 transition"
                                        >
                                            Contact Sales
                                        </Link>
                                    ) : currentSubscription?.plan_name === plan.name ? (
                                        <button
                                            disabled
                                            className="w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gray-400 cursor-not-allowed"
                                        >
                                            Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold text-white transition
                                                ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"}
                                            `}
                                        >
                                            Select Plan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className="mt-12 text-center text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto px-4">
                <p>
                    All prices in PHP. Transaction fees include payment gateway + UPKYP platform fees.
                </p>
                <p className="mt-2">
                    Need custom setup or PMO billing?
                    <Link href="/contact-sales" className="ml-1 text-blue-600 font-medium hover:underline">
                        Talk to us
                    </Link>
                </p>
            </section>
        </main>
    );
}