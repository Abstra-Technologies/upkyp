"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import { Check } from "lucide-react";
import useAuthStore from "@/zustand/authStore";

export default function PricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const isLandlord = user?.landlord_id;

    // useEffect(() => {
    //     if (!isLandlord) {
    //         router.push("/pages/auth/login");
    //     }
    // }, [isLandlord, router]);
    //
    // if (!isLandlord) {
    //     return null;
    // }

    const handleSelectPlan = (plan: any) => {
        if (!user?.landlord_id) {
            localStorage.setItem("pendingPlan", JSON.stringify({
                planId: plan.id,
                amount: plan.price,
                prorated: plan.price,
                addons: "[]"
            }));
            router.push("/pages/auth/login");
            return;
        }

        router.push(
            `/pages/landlord/subsciption_plan/payment/review?planId=${plan.id}&amount=${plan.price}&prorated=${plan.price}&addons=${encodeURIComponent("[]")}`
        );
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 px-6 py-20">
            {/* Header */}
            <section className="max-w-6xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                    Simple, Transparent Pricing
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                    Built for independent landlords, property managers, and growing portfolios.
                </p>
            </section>

            {/* Pricing Cards */}
            <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isFree = plan.price === 0 && plan.name !== "Enterprise Plan";
                    const isEnterprise = plan.name === "Enterprise Plan";

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-2xl border bg-white shadow-sm transition hover:shadow-xl
                ${plan.popular ? "border-blue-600 scale-[1.02]" : "border-gray-200"}
              `}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow">
                                    Most Popular
                                </div>
                            )}

                            {/* Card Content */}
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {plan.name}
                                </h3>

                                {/* Price */}
                                <div className="mt-4">
                                    {isEnterprise ? (
                                        <p className="text-3xl font-extrabold text-gray-900">
                                            Custom
                                        </p>
                                    ) : (
                                        <p className="text-3xl font-extrabold text-gray-900">
                                            ₱{plan.price.toLocaleString()}
                                            <span className="text-base font-medium text-gray-500">
                        {plan.price > 0 && " / month"}
                      </span>
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Transaction Fees */}
                                <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                    <p>
                                        Transaction Fee:{" "}
                                        <span className="font-semibold text-gray-800">
                      {plan.transactionFeeRate}%
                    </span>
                                    </p>
                                    <p>
                                        Discounted Fee (Promo / Volume):{" "}
                                        <span className="font-semibold text-gray-800">
                      {plan.discountedFeeRate}%
                    </span>
                                    </p>
                                </div>

                                {/* CTA */}
                                <div className="mt-6">
                                    {isEnterprise ? (
                                        <Link
                                            href="/contact-sales"
                                            className="block w-full rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 transition"
                                        >
                                            Contact Sales
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition
                        ${
                                                plan.popular
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : "bg-gray-900 hover:bg-gray-800"
                                            }`}
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

            {/* Footer Note */}
            <section className="mt-16 text-center text-sm text-gray-500 max-w-3xl mx-auto">
                <p>
                    All prices are in Philippine Peso (₱). Transaction fees already include
                    payment gateway and UPKYP platform fees.
                </p>
                <p className="mt-2">
                    Need a custom workflow, condo-wide setup, or PMO-managed billing?
                    <Link href="/contact-sales" className="ml-1 text-blue-600 font-medium hover:underline">
                        Talk to us
                    </Link>
                </p>
            </section>
        </main>
    );
}
