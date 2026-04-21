"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Check } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
import CheckoutPanel from "@/components/subscription_pricing/CheckoutPanel";
import { useSubscriptionStore } from "@/zustand/subscriptionStore";

interface PlanFromDB {
    plan_id: number;
    plan_code: string;
    name: string;
    price: number;
    billing_cycle: string;
    is_active: number;
    platform_fee: number;
    fee_type: string;
    max_storage: string | null;
    max_assets_per_property: number | null;
    financial_history_years: number | null;
    prices?: {
        unit_range: string;
        min_units: number;
        max_units: number;
        monthly_price: number | null;
        annual_price: number | null;
    }[];
    features?: Record<string, number>;
    selectedCycle?: "monthly" | "yearly";
}

export default function PricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { currentSubscription, loading: subLoading } = useSubscriptionData();
    const { selectedPlan, setSelectedPlan, clearSelectedPlan } = useSubscriptionStore();

    const [plans, setPlans] = useState<PlanFromDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBand, setSelectedBand] = useState<Record<number, string>>({});
    const [selectedCycle, setSelectedCycle] = useState<Record<number, "monthly" | "yearly">>({});

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await axios.get("/api/systemadmin/subscription_programs/getPlans");
                setPlans(res.data || []);
            } catch (err) {
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = (plan: PlanFromDB) => {
        const bandIndex = selectedBand[plan.plan_id] ?? "-1";
        const unitPrices = plan.prices || [];
        const billingCycle = plan.billing_cycle as "monthly" | "yearly" | "lifetime";
        const cycle = selectedCycle[plan.plan_id] ?? (billingCycle === "yearly" ? "yearly" : "monthly");
        const isLifetimeBilling = billingCycle === "lifetime";
        
        let amount: number | null = null;
        let monthlyPrice = Number(plan.price);
        let bandRange: string | undefined = undefined;
        
        // Use base price if "-1" is selected or no unit prices
        if (bandIndex === "-1" || unitPrices.length === 0) {
            amount = Number(plan.price);
        } else {
            const currentBand = unitPrices[parseInt(bandIndex)];
            if (currentBand) {
                bandRange = currentBand.unit_range;
                // For lifetime billing, only use monthly_price
                if (isLifetimeBilling) {
                    amount = currentBand.monthly_price;
                    monthlyPrice = currentBand.monthly_price || 0;
                } else {
                    amount = cycle === "monthly" ? currentBand.monthly_price : currentBand.annual_price;
                    monthlyPrice = currentBand.monthly_price || 0;
                }
            }
        }
        
        setSelectedPlan({
            id: plan.plan_id,
            planCode: plan.plan_code,
            name: plan.name,
            price: Number(amount) || Number(plan.price) || 0,
            unitBandIndex: parseInt(bandIndex) >= 0 ? parseInt(bandIndex) : -1,
            bandRange,
            monthlyPrice,
            proratedAmount: Number(amount) || Number(plan.price) || 0,
        });
    };

    const handleCheckout = () => {
        if (!user) {
            router.push(`/auth/login?callbackUrl=${encodeURIComponent("/public/pricing")}`);
            return;
        }
        
        router.push("/landlord/subsciption_plan/payment/review");
    };

    const handleCancel = () => {
        clearSelectedPlan();
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
                {loading ? (
                    <div className="col-span-full text-center py-10">
                        <p className="text-gray-500">Loading plans...</p>
                    </div>
                ) : plans.map((plan) => {
                    const isEnterprise = plan.plan_code === "ENTERPRISE" || plan.name.toLowerCase().includes("enterprise");
                    const hasUnitPrices = plan.prices && plan.prices.length > 0;
                    const currentBandIndex = selectedBand[plan.plan_id] ?? "-1";
                    const currentBand = currentBandIndex !== "-1" && hasUnitPrices && plan.prices ? plan.prices[parseInt(currentBandIndex)] : null;
                    const billingCycle = plan.billing_cycle as "monthly" | "yearly" | "lifetime";
                    const cycle = selectedCycle[plan.plan_id] ?? 
                        (billingCycle === "yearly" ? "yearly" : "monthly");
                    const hasAnnualPrices = hasUnitPrices && currentBand && currentBand.annual_price != null;
                    const isLifetimeBilling = billingCycle === "lifetime";
                    let displayPrice = plan.price;
                    if (currentBand) {
                        displayPrice = !isLifetimeBilling && hasAnnualPrices
                            ? (cycle === "monthly" ? currentBand?.monthly_price || plan.price : currentBand?.annual_price || plan.price)
                            : currentBand?.monthly_price || plan.price;
                    } else if (!hasUnitPrices) {
                        displayPrice = plan.price;
                    }

                    return (
                        <div
                            key={plan.plan_id}
                            className={`relative flex flex-col rounded-xl border bg-white shadow-sm transition hover:shadow-md
                                ${currentSubscription?.plan_name === plan.name 
                                    ? "ring-2 ring-green-500 border-green-500" 
                                    : plan.plan_code === "GROWTH"
                                        ? "border-blue-500 ring-1 ring-blue-500" 
                                        : "border-gray-200"}
                            `}
                        >
                            {currentSubscription?.plan_name === plan.name ? (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                                    Current Plan
                                </div>
                            ) : plan.plan_code === "GROWTH" ? (
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
                                            ₱{displayPrice?.toLocaleString() || 0}
                                            <span className="text-sm font-medium text-gray-500">
                                                {(displayPrice || 0) > 0 && (
                                                    isLifetimeBilling 
                                                        ? "" 
                                                        : hasUnitPrices && hasAnnualPrices 
                                                            ? (cycle === "monthly" ? "/mo" : "/yr") 
                                                            : "/mo"
                                                )}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Cycle Toggle (only if annual prices exist, not for lifetime) */}
                                {hasUnitPrices && hasAnnualPrices && !isLifetimeBilling && (
                                    <div className="mt-3 flex rounded-lg bg-gray-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCycle({ ...selectedCycle, [plan.plan_id]: "monthly" })}
                                            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                                                cycle === "monthly" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                                            }`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCycle({ ...selectedCycle, [plan.plan_id]: "yearly" })}
                                            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                                                cycle === "yearly" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                                            }`}
                                        >
                                            Annually
                                        </button>
                                    </div>
                                )}

                                {/* Unit Price Dropdown */}
                                {hasUnitPrices && (
                                    <div className="mt-3">
                                        <select
                                            value={currentBandIndex}
                                            onChange={(e) =>
                                                setSelectedBand({ ...selectedBand, [plan.plan_id]: e.target.value })
                                            }
                                            className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm bg-gray-100 border border-gray-300 text-gray-800 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                                        >
                                            <option value="-1">Base Price</option>
                                            {plan.prices?.map((band, idx) => (
                                                <option key={idx} value={String(idx)}>
                                                    {band.unit_range}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>Up to {plan.max_assets_per_property || "unlimited"} assets</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>{plan.max_storage || "Unlimited"} storage</span>
                                    </li>
                                </ul>

                                {!isEnterprise && plan.price > 0 && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Platform Fee:</span>
                                            <span className="font-semibold">{plan.platform_fee}%</span>
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
                                                ${plan.plan_code === "GROWTH" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"}
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

            {selectedPlan && (
                <CheckoutPanel 
                    onCheckout={handleCheckout} 
                    onCancel={handleCancel} 
                />
            )}
        </main>
    );
}