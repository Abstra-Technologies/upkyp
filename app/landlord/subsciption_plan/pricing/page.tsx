"use client";

import { useState } from "react";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import { useProrate } from "@/hooks/landlord/useProrate";
import PlanCard from "@/components/subscription_pricing/PlanCard";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
import ProrateNotice from "@/components/subscription_pricing/ProrateNotice";
import FAQ from "@/components/subscription_pricing/FAQ";
import CheckoutPanel from "@/components/subscription_pricing/CheckoutPanel";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatter/formatters";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";
import { useSubscriptionStore } from "@/zustand/subscriptionStore";

export default function SubscriptionPlans() {
    const router = useRouter();
    const { currentSubscription, loading } = useSubscriptionData();
    const prorate = useProrate(currentSubscription);
    const {user} = useAuthStore();
    const { selectedPlan, setSelectedPlan, clearSelectedPlan } = useSubscriptionStore();

    const [selectedPlanLocal, setSelectedPlanLocal] = useState<any>(null);
    const [proratedAmount, setProratedAmount] = useState<number>(0);
    const [activating, setActivating] = useState(false);

    const activePlan = selectedPlan || selectedPlanLocal;

    if (loading) return <div className="text-center py-20">Loading…</div>;

    const handleSelectPlan = (plan: any) => {
        if (plan.price === 0) {
            setSelectedPlanLocal(plan);
            setProratedAmount(prorate(plan));
        } else {
            const amount = plan.price;
            setSelectedPlan({
                id: plan.id,
                name: plan.name,
                price: amount,
                unitBandIndex: undefined,
                bandRange: undefined,
                monthlyPrice: amount,
                proratedAmount: amount,
            });
            setSelectedPlanLocal(null);
        }
    };

    const isFreePlan = activePlan?.price === 0;
    const originalPlanPrice = activePlan?.price || 0;
    const finalPlanAmount = proratedAmount || originalPlanPrice;

    const activateSubscription = async () => {
        if (!activePlan || !user?.landlord_id) return;

        setActivating(true);

        try {
            await axios.post("/api/landlord/subscription/freeTrialTest", {
                landlord_id: user.landlord_id,
                plan_name: activePlan.name,
            });

            await Swal.fire({
                title: "Activated",
                text: `${activePlan.name} is now active.`,
                icon: "success",
                confirmButtonText: "Go to Dashboard",
            });

            router.push("/landlord/dashboard");
        } catch (err: any) {
            await Swal.fire(
                "Activation Failed",
                err?.response?.data?.error ||
                "Unable to activate plan. Please try again.",
                "error"
            );
        } finally {
            setActivating(false);
        }
    };

    const handleProceed = () => {
        if (!activePlan) {
            Swal.fire("Plan Required", "Select a plan to continue.", "warning");
            return;
        }

        if (isFreePlan) {
            activateSubscription();
            return;
        }

        router.push("/landlord/subsciption_plan/payment/review");
    };

    const handleCheckout = () => {
        router.push("/landlord/subsciption_plan/payment/review");
    };

    const handleCancel = () => {
        setSelectedPlan(null);
        setSelectedPlanLocal(null);
    };

    const actionLabel = isFreePlan
        ? activating
            ? "Activating…"
            : "Activate Free Plan"
        : activating
            ? "Processing…"
            : "Proceed to Checkout";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Plans</h2>

                        <div className="flex flex-col gap-4 max-w-3xl">
                            {SUBSCRIPTION_PLANS.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isSelected={activePlan?.id === plan.id}
                                    onSelect={handleSelectPlan}
                                />
                            ))}
                        </div>
                    </section>

                    {activePlan && currentSubscription && !isFreePlan && (
                        <ProrateNotice proratedAmount={proratedAmount} />
                    )}
                </div>

                <aside className="lg:sticky lg:top-24 h-fit">
                    <div className="bg-white border rounded-2xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4">Summary</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Plan Price</span>
                                <span>{formatCurrency(originalPlanPrice)}</span>
                            </div>

                            <hr />

                            <div className="flex justify-between text-base font-bold">
                                <span>Total Due Now</span>
                                <span>{formatCurrency(finalPlanAmount)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleProceed}
                            disabled={!activePlan || activating}
                            className={`w-full mt-6 py-3 rounded-lg text-white font-semibold transition ${
                                activePlan
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {actionLabel}
                        </button>
                    </div>
                </aside>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total Due Now</span>
                    <span className="font-bold">
                        {formatCurrency(finalPlanAmount)}
                    </span>
                </div>

                <button
                    onClick={handleProceed}
                    disabled={!activePlan || activating}
                    className={`w-full py-3 rounded-lg text-white font-semibold ${
                        activePlan
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

            {selectedPlan && (
                <CheckoutPanel 
                    onCheckout={handleCheckout} 
                    onCancel={handleCancel} 
                />
            )}
        </div>
    );
}
