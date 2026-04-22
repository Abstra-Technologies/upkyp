"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Check } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
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
    const { selectedPlan, setSelectedPlan } = useSubscriptionStore();

    const [plans, setPlans] = useState<PlanFromDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBand, setSelectedBand] = useState<Record<number, string>>({});
    const [selectedCycle, setSelectedCycle] = useState<Record<number, "monthly" | "yearly">>({});

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await axios.get("/api/systemadmin/subscription_programs/getPlans");
                console.log("Fetched plans:", JSON.stringify(res.data, null, 2));
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
        const bandIndex = selectedBand[plan.plan_id] ?? "0";
        const unitPrices = plan.prices || [];
        const billingCycle = plan.billing_cycle as "monthly" | "yearly" | "lifetime";
        const cycle = selectedCycle[plan.plan_id] ?? (billingCycle === "yearly" ? "yearly" : "monthly");
        const isLifetimeBilling = billingCycle === "lifetime";
        
        const currentBand = unitPrices.length > 0 ? unitPrices[parseInt(bandIndex)] : null;
        
        let amount = Number(plan.price);
        let monthlyPrice = Number(plan.price);
        let bandRange: string | undefined = undefined;
        
        if (currentBand) {
            bandRange = currentBand.unit_range;
            monthlyPrice = Number(currentBand.monthly_price) || Number(plan.price);
            if (isLifetimeBilling) {
                amount = Number(currentBand.monthly_price) || Number(plan.price);
            } else {
                amount = cycle === "monthly" 
                    ? (Number(currentBand.monthly_price) || Number(plan.price)) 
                    : (Number(currentBand.annual_price) || Number(plan.price));
            }
        }
        
        setSelectedPlan({
            id: plan.plan_id,
            planCode: plan.plan_code,
            name: plan.name,
            price: amount,
            unitBandIndex: parseInt(bandIndex),
            bandRange,
            monthlyPrice,
            proratedAmount: amount,
        });

        if (!user) {
            router.push(`/auth/login?callbackUrl=${encodeURIComponent("/public/pricing")}`);
        } else {
            router.push("/landlord/subsciption_plan/payment/review");
        }
    };

    const handleCheckout = () => {
        if (!user) {
            router.push(`/auth/login?callbackUrl=${encodeURIComponent("/public/pricing")}`);
            return;
        }
        
        router.push("/landlord/subsciption_plan/payment/review");
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

            <section className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                {loading ? (
                    <div className="w-full text-center py-10">
                        <p className="text-gray-500">Loading plans...</p>
                    </div>
                ) : plans.map((plan) => {
                    const hasUnitPrices = plan.prices && plan.prices.length > 0;
                    const currentBandIndex = selectedBand[plan.plan_id] ?? "0";
                    const billingCycle = plan.billing_cycle as "monthly" | "yearly" | "lifetime";
                    const cycle = selectedCycle[plan.plan_id] ?? 
                        (billingCycle === "yearly" ? "yearly" : "monthly");
                    const isLifetimeBilling = billingCycle === "lifetime";
                    const currentBand = hasUnitPrices && plan.prices 
                        ? plan.prices[parseInt(currentBandIndex)] 
                        : null;
                    const hasAnnualPrices = hasUnitPrices && plan.prices && plan.prices.some((p: any) => p.annual_price != null);
                    let displayPrice = Number(plan.price);
                    
                    if (currentBand) {
                        if (isLifetimeBilling || !hasAnnualPrices) {
                            displayPrice = Number(currentBand.monthly_price) || Number(plan.price);
                        } else {
                            displayPrice = cycle === "monthly" 
                                ? (Number(currentBand.monthly_price) || Number(plan.price)) 
                                : (Number(currentBand.annual_price) || Number(plan.price));
                        }
                    }

                    return (
                        <div
                            key={plan.plan_id}
                            className={`relative flex flex-col rounded-2xl border-2 bg-gray-50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-400 hover:bg-white hover:-translate-y-1 w-72 sm:w-80
                                ${currentSubscription?.plan_name === plan.name 
                                    ? "ring-2 ring-green-500 border-green-500 bg-white" 
                                    : plan.plan_code === "GROWTH"
                                        ? "border-blue-300" 
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

                            <div className="p-5 sm:p-6 flex flex-col flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {plan.name}
                                </h3>

                                <div className="mt-4">
                                    <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">
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
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            How many units do you own/manage?
                                        </label>
                                        <select
                                            value={currentBandIndex}
                                            onChange={(e) =>
                                                setSelectedBand({ ...selectedBand, [plan.plan_id]: e.target.value })
                                            }
                                            className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm bg-gray-100 border border-gray-300 text-gray-800 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                                        >
                                            {plan.prices?.map((band, idx) => (
                                                <option key={idx} value={String(idx)}>
                                                    {band.unit_range}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <ul className="mt-5 space-y-3 text-sm text-gray-700">
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                            <Check className="h-3 w-3 text-emerald-600" />
                                        </div>
                                        <span>Up to {plan.max_assets_per_property || "unlimited"} assets</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                            <Check className="h-3 w-3 text-emerald-600" />
                                        </div>
                                        <span>{plan.max_storage || "Unlimited"} storage</span>
                                    </li>
                                </ul>

                                {plan.price > 0 && (
                                    <div className="mt-5 rounded-lg bg-gray-100 p-3 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Platform Fee:</span>
                                            <span className="font-semibold">{plan.platform_fee}%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-5">
                                    {currentSubscription?.plan_name === plan.name ? (
                                        <button
                                            disabled
                                            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gray-400 cursor-not-allowed"
                                        >
                                            Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-md
                                                ${plan.plan_code === "GROWTH" ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg" : "bg-gray-900 hover:bg-gray-800 hover:shadow-lg"}
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