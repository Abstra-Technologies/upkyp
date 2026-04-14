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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="px-4 pt-20 pb-24 md:px-6 md:pt-6 lg:px-8 max-w-7xl mx-auto">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl">
                            <ReceiptPercentIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Billing Statement
                            </h1>
                            <p className="text-sm text-gray-600">
                                Review your monthly billing details
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= TABS (ALL SCREENS) ================= */}
                <div className="mb-8">
                    <div className="grid grid-cols-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Current */}
                        <button
                            onClick={() => setActiveTab("current")}
                            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${
                                activeTab === "current"
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ReceiptPercentIcon className="w-4 h-4" />
                            Current
                        </button>

                        {/* Overdue */}
                        <button
                            onClick={() => setActiveTab("overdue")}
                            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${
                                activeTab === "overdue"
                                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            Overdue
                        </button>

                        {/* History */}
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${
                                activeTab === "history"
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <ClockIcon className="w-4 h-4" />
                            History
                        </button>
                    </div>
                </div>

                {/* ================= TAB CONTENT ================= */}
                <div className="space-y-6">

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
