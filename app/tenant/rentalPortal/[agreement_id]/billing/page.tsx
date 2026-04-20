"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import useAuthStore from "@/zustand/authStore";

import TenantBilling from "@/components/tenant/billing/currentBilling";
import PreviousBilling from "@/components/tenant/billing/prevBillingList";
import OverdueBilling from "@/components/tenant/billing/OverdueBilling";

import {
    ReceiptPercentIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function BillingContent() {
    const { user, fetchSession } = useAuthStore();
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [activeTab, setActiveTab] = useState<
        "current" | "overdue" | "history"
    >("current");

    const params = useParams();
    const agreementId = params?.agreement_id as string | undefined;

    useEffect(() => {
        async function init() {
            if (!user) {
                await fetchSession();
            }
            setIsInitialLoad(false);
        }
        init();
    }, [user, fetchSession]);

    /* ---------------- LOADING ---------------- */
    if (isInitialLoad) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Loading billing...</p>
                </div>
            </div>
        );
    }

    /* ---------------- NO USER ---------------- */
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-3 pt-16 pb-24 md:px-6 md:pt-6 lg:px-8 max-w-7xl mx-auto">

                <div className="mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
                            <ReceiptPercentIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-gray-900">
                                Billing Statement
                            </h1>
                            <p className="text-xs text-gray-500 hidden sm:block">
                                Review your monthly billing details
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveTab("current")}
                            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
                                activeTab === "current"
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ReceiptPercentIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Current</span>
                            <span className="sm:hidden">Current</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("overdue")}
                            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
                                activeTab === "overdue"
                                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Overdue</span>
                            <span className="sm:hidden">Overdue</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
                                activeTab === "history"
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">History</span>
                            <span className="sm:hidden">History</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">

                    {activeTab === "current" && (
                        <TenantBilling
                            agreement_id={agreementId}
                            user_id={user.user_id}
                        />
                    )}

                    {activeTab === "overdue" && (
                        <OverdueBilling
                            agreement_id={agreementId}
                            user_id={user.user_id}
                        />
                    )}

                    {activeTab === "history" && (
                        <PreviousBilling
                            agreement_id={agreementId}
                            user_id={user.user_id}
                        />
                    )}

                </div>
            </div>
        </div>
    );
}

export default function TenantBillingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-gray-600 font-medium">
                            Loading billing data...
                        </p>
                    </div>
                </div>
            }
        >
            <BillingContent />
        </Suspense>
    );
}
