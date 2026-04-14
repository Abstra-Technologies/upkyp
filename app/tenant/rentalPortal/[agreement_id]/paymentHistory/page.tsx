"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import TenantLeasePayments from "@/components/tenant/currentRent/currentLeasePaymentHistory";
import TenantPdcSummary from "@/components/tenant/currentRent/TenantPdcSummary";

function TenantPaymentsContent() {
    const params = useParams();
    const agreement_id = params?.agreement_id as string;

    console.log("payment history page: ", agreement_id);

    return agreement_id ? (
        <div className="space-y-6">
            <TenantPdcSummary agreement_id={agreement_id} />

            {/* Existing payment history */}
            <TenantLeasePayments agreement_id={agreement_id} />
        </div>
    ) : (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Error</h1>
                        <p className="text-gray-600 text-sm">No agreement ID provided</p>
                    </div>
                </div>
            </div>
            <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                    <p className="text-amber-700 font-medium">
                        No agreement ID provided. Please try again.
                    </p>
                </div>
            </div>
        </div>
    );
}

function PaymentsFallback() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                        <div>
                            <div className="h-7 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
                        </div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <div className="h-10 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TenantPayments() {
    return (
        <Suspense fallback={<PaymentsFallback />}>
            <TenantPaymentsContent />
        </Suspense>
    );
}
