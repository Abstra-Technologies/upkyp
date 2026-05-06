"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Check, Calculator } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import useSubscriptionData from "../../../hooks/landlord/subscription/useSubscriptionData";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
import PlanCalculatorModal from "@/components/subscription_pricing/PlanCalculatorModal";
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
    unitPricesByType?: Record<string, number>;
    features?: Record<string, number>;
    selectedCycle?: "monthly" | "yearly";
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    residential: "Residential",
    commercial: "Commercial",
    mixed: "Mixed Use",
};

interface PricingCardProps {
    plan: PlanFromDB;
    currentSubscription: any;
    onSelectPlan: (plan: PlanFromDB) => void;
}

function PricingCard({ plan, currentSubscription, onSelectPlan }: PricingCardProps) {
    const billingCycle = plan.billing_cycle as "monthly" | "yearly" | "lifetime";
    const isLifetimeBilling = billingCycle === "lifetime";
    const isPopular = plan.plan_code === "GROWTH";
    const isCurrentPlan = currentSubscription?.plan_name === plan.name;

    const unitPricesByType = plan.unitPricesByType || {};
    const hasAnyUnitPrices = Object.keys(unitPricesByType).length > 0;

    return (
        <div
            className={`relative flex flex-col rounded-2xl bg-white border border-gray-200 shadow-md transition-all duration-300 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 w-full
                ${isPopular ? "ring-2 ring-blue-500 scale-105 z-10 shadow-xl hover:shadow-2xl" : ""}
                ${isCurrentPlan ? "ring-2 ring-green-500" : ""}
            `}
        >
            {isPopular && (
                <div className="bg-blue-500 text-white text-center py-2 px-4 rounded-t-2xl">
                    <span className="text-xs font-semibold uppercase tracking-wide">Most Popular</span>
                </div>
            )}

            {isCurrentPlan && !isPopular && (
                <div className="bg-green-500 text-white text-center py-2 px-4 rounded-t-2xl">
                    <span className="text-xs font-semibold uppercase tracking-wide">Current Plan</span>
                </div>
            )}

            <div className={`p-5 sm:p-6 flex flex-col flex-1 ${isPopular || isCurrentPlan ? "pt-5 sm:pt-6" : "pt-7 sm:pt-8"}`}>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center">
                    {plan.name}
                </h3>

                <div className="mt-3 sm:mt-4 text-center">
                    <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        ₱{Number(plan.price).toLocaleString() || 0}
                        <span className="text-xs sm:text-sm font-medium text-gray-500">
                            {!isLifetimeBilling && "/mo"}
                        </span>
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">Base price (floor)</p>
                </div>

                {hasAnyUnitPrices && (
                    <div className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Per unit/month:</p>
                        <div className="space-y-1.5">
                            {Object.entries(unitPricesByType).map(([type, price]) => (
                                <div key={type} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                        {PROPERTY_TYPE_LABELS[type] || type}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        ₱{price.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                    <li className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Up to {plan.max_assets_per_property || "unlimited"} assets per property</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{plan.max_storage || "Unlimited"} document storage</span>
                    </li>
                    {plan.financial_history_years && (
                        <li className="flex items-start gap-2 sm:gap-3">
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>{plan.financial_history_years} years financial history</span>
                        </li>
                    )}
                </ul>

                {plan.price > 0 && (
                    <div className="mt-4 sm:mt-5 rounded-lg bg-gray-50 p-2.5 sm:p-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Xendit Payment Gateway Fee:</span>
                            <span className="font-semibold text-gray-900">2.50%</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span>UPKYP Platform Fee:</span>
                            <span className="font-semibold text-gray-900">{plan.platform_fee}%</span>
                        </div>
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                            <span>Total Transaction Fee:</span>
                            <span className="font-semibold text-gray-900">{(2.5 + Number(plan.platform_fee || 0)).toFixed(2)}%</span>
                        </div>
                    </div>
                )}

                <div className="mt-5 sm:mt-6">
                    {isCurrentPlan ? (
                        <button
                            disabled
                            className="w-full rounded-lg px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-500 bg-gray-100 cursor-not-allowed"
                        >
                            Current Plan
                        </button>
                    ) : (
                        <button
                            onClick={() => onSelectPlan(plan)}
                            className={`w-full rounded-lg px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300
                                ${isPopular
                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"}
                            `}
                        >
                            Subscribe
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { currentSubscription, loading: subLoading } = useSubscriptionData();
    const { selectedPlan, setSelectedPlan } = useSubscriptionStore();

    const [plans, setPlans] = useState<PlanFromDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMobileTab, setActiveMobileTab] = useState(0);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

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
        setSelectedPlan({
            id: plan.plan_id,
            planCode: plan.plan_code,
            name: plan.name,
            price: Number(plan.price),
            unitPricesByType: plan.unitPricesByType || {},
            monthlyPrice: Number(plan.price),
            proratedAmount: Number(plan.price),
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
                        Usage-based pricing with a guaranteed floor. Pay only for what you use — never less than your base plan price.
                    </p>
                    <button
                        onClick={() => setIsCalculatorOpen(true)}
                        className="mt-6 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl border border-white/20 transition-all duration-300 hover:scale-105"
                    >
                        <Calculator className="w-5 h-5" />
                        Estimate Your Cost
                    </button>
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
                {/* Mobile Tab Navigation */}
                <div className="lg:hidden flex justify-center mb-6 overflow-x-auto">
                    <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                        {plans.map((plan, idx) => (
                            <button
                                key={plan.plan_id}
                                onClick={() => setActiveMobileTab(idx)}
                                className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition ${
                                    activeMobileTab === idx
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {plan.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start justify-items-center">
                    {loading ? (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-500">Loading plans...</p>
                        </div>
                    ) : plans.map((plan) => (
                        <PricingCard
                            key={plan.plan_id}
                            plan={plan}
                            currentSubscription={currentSubscription}
                            onSelectPlan={handleSelectPlan}
                        />
                    ))}
                </div>

                {/* Mobile Single Card View */}
                <div className="lg:hidden w-full max-w-md mx-auto px-2">
                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Loading plans...</p>
                        </div>
                    ) : plans[activeMobileTab] && (
                        <PricingCard
                            key={plans[activeMobileTab].plan_id}
                            plan={plans[activeMobileTab]}
                            currentSubscription={currentSubscription}
                            onSelectPlan={handleSelectPlan}
                        />
                    )}
                </div>
            </section>

            {/* Footer Note */}
            <section className="pb-16 text-center text-sm text-gray-500 max-w-2xl mx-auto px-4">
                <p>
                    All prices in PHP. Usage-based billing — you pay the higher of the base price or your actual unit usage.
                </p>
                <p className="mt-2">
                    Need custom setup or PMO billing?
                    <Link href="/contact-sales" className="ml-1 text-blue-600 font-medium hover:underline">
                        Talk to us
                    </Link>
                </p>
            </section>

            {/* Pricing Explainer */}
            <section className="pb-20 max-w-4xl mx-auto px-4">
                <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold">
                                How Our Pricing Works
                            </h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left side - Explanation */}
                        <div className="space-y-4">
                            <p className="text-blue-200 text-sm sm:text-base">
                                Each plan has a <span className="text-white font-semibold bg-white/10 px-2 py-0.5 rounded">base monthly price</span> (your guaranteed floor) and a <span className="text-white font-semibold bg-white/10 px-2 py-0.5 rounded">per-unit price</span> based on property type.
                            </p>

                            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
                                <p className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide">Your Monthly Cost</p>
                                <div className="font-mono text-sm sm:text-base">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <span className="bg-blue-500/30 px-3 py-1.5 rounded-lg">max(Base Price, Units × Per-Unit)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-xs text-blue-200">
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold shrink-0">1.</span>
                                    <span>Subscribe — link your payment method and get charged the base price immediately.</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-blue-200">
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold shrink-0">2.</span>
                                    <span>Each month, we count your units by property type and calculate the usage cost.</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-blue-200">
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold shrink-0">3.</span>
                                    <span>You pay the higher of the base price or the usage-based amount.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs sm:text-sm text-amber-200">
                                    <span className="font-semibold text-amber-400">Pay &amp; Save:</span> Your payment method is saved securely. First charge is the <span className="font-bold text-white">base price</span>. Future charges are calculated based on your actual unit usage.
                                </p>
                            </div>
                        </div>

                            {/* Right side - Visual Example */}
                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                                <p className="text-xs text-blue-300 mb-4 font-medium uppercase tracking-wide">Example Calculation</p>

                                <div className="space-y-4">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-green-400 text-xs font-medium">✓ Floor Price Applies</span>
                                            <span className="text-green-400 font-bold">₱500</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-200">
                                            <div>PRO Base: <span className="text-white font-semibold">₱500</span></div>
                                            <div>Unit Price: <span className="text-white font-semibold">₱5</span></div>
                                            <div>Your Units: <span className="text-white font-semibold">10</span></div>
                                            <div>Usage Cost: <span className="text-white font-semibold">10 × ₱5 = ₱50</span></div>
                                        </div>
                                        <div className="border-t border-green-500/20 mt-2 pt-2 text-xs text-green-300">
                                            max(₱500, ₱50) = <span className="font-bold text-white">₱500</span> (floor price)
                                        </div>
                                    </div>

                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-orange-400 text-xs font-medium">↑ Usage Exceeds Floor</span>
                                            <span className="text-orange-400 font-bold">₱1,000</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-200">
                                            <div>PRO Base: <span className="text-white font-semibold">₱500</span></div>
                                            <div>Unit Price: <span className="text-white font-semibold">₱5</span></div>
                                            <div>Your Units: <span className="text-white font-semibold">200</span></div>
                                            <div>Usage Cost: <span className="text-white font-semibold">200 × ₱5 = ₱1,000</span></div>
                                        </div>
                                        <div className="border-t border-orange-500/20 mt-2 pt-2 text-xs text-orange-300">
                                            max(₱500, ₱1,000) = <span className="font-bold text-white">₱1,000</span> (usage-based)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <PlanCalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </main>
    );
}