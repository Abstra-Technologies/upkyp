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
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section with Gradient */}
            <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 px-4 py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
                </div>
                <div className="relative max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                        Pricing plans for properties of all sizes
                    </h1>
                    <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                        From single-unit landlords to growing property portfolios — find the perfect plan to manage your rentals efficiently.
                    </p>
                </div>
            </section>

            {/* Show current subscription banner if user is logged in */}
            {!loading && user && currentSubscription && (
                <div className="max-w-6xl mx-auto -mt-8 mb-8 relative z-10 px-4">
                    <CurrentSubscriptionBanner currentSubscription={currentSubscription} />
                </div>
            )}

            {/* Pricing Cards */}
            <section className="relative -mt-12 px-4 pb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start justify-items-center">
                    {loading ? (
                        <div className="col-span-full text-center py-10">
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
                        const isPopular = plan.plan_code === "GROWTH";
                        const isCurrentPlan = currentSubscription?.plan_name === plan.name;
                        
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
                                className={`relative flex flex-col rounded-2xl bg-white border border-gray-200 shadow-md transition-all duration-300 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 w-full
                                    ${isPopular ? "ring-2 ring-blue-500 scale-105 z-10 shadow-xl hover:shadow-2xl" : ""}
                                    ${isCurrentPlan ? "ring-2 ring-green-500" : ""}
                                `}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="bg-blue-500 text-white text-center py-2 px-4 rounded-t-2xl">
                                        <span className="text-xs font-semibold uppercase tracking-wide">Most Popular</span>
                                    </div>
                                )}

                                {/* Current Plan Badge */}
                                {isCurrentPlan && !isPopular && (
                                    <div className="bg-green-500 text-white text-center py-2 px-4 rounded-t-2xl">
                                        <span className="text-xs font-semibold uppercase tracking-wide">Current Plan</span>
                                    </div>
                                )}

                                <div className={`p-6 flex flex-col flex-1 ${isPopular || isCurrentPlan ? "pt-6" : "pt-8"}`}>
                                    <h3 className="text-lg font-bold text-gray-900 text-center">
                                        {plan.name}
                                    </h3>

                                    <div className="mt-4 text-center">
                                        <p className="text-4xl font-extrabold text-gray-900">
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

                                    {/* Cycle Toggle */}
                                    {hasUnitPrices && hasAnnualPrices && !isLifetimeBilling && (
                                        <div className="mt-4 flex rounded-lg bg-gray-100 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCycle({ ...selectedCycle, [plan.plan_id]: "monthly" })}
                                                className={`flex-1 rounded-md py-2 text-xs font-medium transition ${
                                                    cycle === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                                                }`}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCycle({ ...selectedCycle, [plan.plan_id]: "yearly" })}
                                                className={`flex-1 rounded-md py-2 text-xs font-medium transition ${
                                                    cycle === "yearly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                                                }`}
                                            >
                                                Annually
                                            </button>
                                        </div>
                                    )}

                                    {/* Unit Price Dropdown */}
                                    {hasUnitPrices && (
                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-600 mb-1 text-center">
                                                Number of units
                                            </label>
                                            <select
                                                value={currentBandIndex}
                                                onChange={(e) =>
                                                    setSelectedBand({ ...selectedBand, [plan.plan_id]: e.target.value })
                                                }
                                                className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {plan.prices?.map((band, idx) => (
                                                    <option key={idx} value={String(idx)}>
                                                        {band.unit_range}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Features */}
                                    <ul className="mt-6 space-y-3 text-sm text-gray-600">
                                        <li className="flex items-start gap-3">
                                            <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <span>Up to {plan.max_assets_per_property || "unlimited"} assets per property</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <span>{plan.max_storage || "Unlimited"} document storage</span>
                                        </li>
                                        {plan.financial_history_years && (
                                            <li className="flex items-start gap-3">
                                                <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <span>{plan.financial_history_years} years financial history</span>
                                            </li>
                                        )}
                                    </ul>

                                    {plan.price > 0 && (
                                        <div className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                                <span>Platform Fee:</span>
                                                <span className="font-semibold text-gray-900">{plan.platform_fee}%</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6">
                                        {isCurrentPlan ? (
                                            <button
                                                disabled
                                                className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-100 cursor-not-allowed"
                                            >
                                                Current Plan
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300
                                                    ${isPopular 
                                                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg" 
                                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"}
                                                `}
                                            >
                                                Get started
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Footer Note */}
            <section className="pb-16 text-center text-sm text-gray-500 max-w-2xl mx-auto px-4">
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