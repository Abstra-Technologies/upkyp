"use client";

import { useState } from "react";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import { useProrate } from "@/hooks/landlord/useProrate";
import PlanCard from "@/components/subscription_pricing/PlanCard";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
import ProrateNotice from "@/components/subscription_pricing/ProrateNotice";
import AddOnServices from "@/components/subscription_pricing/AddOnServices";
import FAQ from "@/components/subscription_pricing/FAQ";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatter/formatters";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

export default function SubscriptionPlans() {
    const router = useRouter();
    const { currentSubscription, loading } = useSubscriptionData();
    const prorate = useProrate(currentSubscription);
    const {user} = useAuthStore();

    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [proratedAmount, setProratedAmount] = useState<number>(0);
    const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
    const [activating, setActivating] = useState(false);

    if (loading) return <div className="text-center py-20">Loading…</div>;

    /* ===============================
       PLAN SELECTION
    =============================== */
    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setProratedAmount(prorate(plan));
        setSelectedAddOns([]);
    };

    const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);

    /* ===============================
       PLAN TYPE
    =============================== */
    const isFreePlan = selectedPlan?.price === 0;
    const isPaidPlan = selectedPlan?.price > 0;

    const originalPlanPrice = selectedPlan?.price || 0;
    const finalPlanAmount = proratedAmount || originalPlanPrice;
    const finalTotal = finalPlanAmount + addOnTotal;

    /* ===============================
       ACTIVATE FREE PLAN
    =============================== */
    const activateSubscription = async () => {
        if (!selectedPlan || !user?.landlord_id) return;

        setActivating(true);

        try {
            await axios.post("/api/landlord/subscription/freeTrialTest", {
                landlord_id: user.landlord_id,
                plan_name: selectedPlan.name,
            });

            await Swal.fire({
                title: "Activated",
                text: `${selectedPlan.name} is now active.`,
                icon: "success",
                confirmButtonText: "Go to Dashboard",
            });

            router.push("/pages/landlord/dashboard");
        } catch (err: any) {
            Swal.fire(
                "Activation Failed",
                err?.response?.data?.error ||
                "Unable to activate plan. Please try again.",
                "error"
            );
        } finally {
            setActivating(false);
        }
    };

    /* ===============================
       PROCEED HANDLER
    =============================== */
    const handleProceed = () => {
        if (!selectedPlan) {
            Swal.fire("Plan Required", "Select a plan to continue.", "warning");
            return;
        }

        if (isFreePlan) {
            activateSubscription();
            return;
        }

        router.push(
            `/pages/landlord/subsciption_plan/payment/review?planId=${selectedPlan.id}` +
            `&amount=${finalTotal}` +
            `&prorated=${finalPlanAmount}` +
            `&addons=${encodeURIComponent(JSON.stringify(selectedAddOns))}`
        );
    };

    /* ===============================
       BUTTON LABEL
    =============================== */
    const actionLabel = isFreePlan
        ? activating
            ? "Activating…"
            : "Activate Free Plan"
        : activating
            ? "Processing…"
            : "Proceed to Checkout";

    /* ===============================
       UI
    =============================== */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold">
                    Choose Your Perfect Plan
                </h1>
                <p className="mt-2 text-gray-600">
                    Upgrade anytime. Transparent pricing. No hidden fees.
                </p>
            </div>

            <CurrentSubscriptionBanner currentSubscription={currentSubscription} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                {/* LEFT */}
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Plans</h2>

                        <div className="flex flex-col gap-4 max-w-3xl">
                            {SUBSCRIPTION_PLANS.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isSelected={selectedPlan?.id === plan.id}
                                    onSelect={handleSelectPlan}
                                />
                            ))}
                        </div>
                    </section>

                    {selectedPlan && currentSubscription && !isFreePlan && (
                        <ProrateNotice proratedAmount={proratedAmount} />
                    )}

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            Add-on Services
                        </h2>
                        <AddOnServices
                            selectedAddOns={selectedAddOns}
                            onChange={setSelectedAddOns}
                            hasSelectedPlan={!!selectedPlan}
                        />
                    </section>
                </div>

                {/* SUMMARY */}
                <aside className="lg:sticky lg:top-24 h-fit">
                    <div className="bg-white border rounded-2xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4">Summary</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Plan Price</span>
                                <span>{formatCurrency(originalPlanPrice)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Add-ons</span>
                                <span>{formatCurrency(addOnTotal)}</span>
                            </div>

                            <hr />

                            <div className="flex justify-between text-base font-bold">
                                <span>Total Due Now</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleProceed}
                            disabled={!selectedPlan || activating}
                            className={`w-full mt-6 py-3 rounded-lg text-white font-semibold transition ${
                                selectedPlan
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {actionLabel}
                        </button>
                    </div>
                </aside>
            </div>

            {/* MOBILE CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total Due Now</span>
                    <span className="font-bold">
                        {formatCurrency(finalTotal)}
                    </span>
                </div>

                <button
                    onClick={handleProceed}
                    disabled={!selectedPlan || activating}
                    className={`w-full py-3 rounded-lg text-white font-semibold ${
                        selectedPlan
                            ? "bg-blue-600"
                            : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                    {actionLabel}
                </button>
            </div>

            <div className="mt-20">
                <FAQ />
            </div>
        </div>
    );
}
