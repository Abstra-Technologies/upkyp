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
        <div className="space-y-4">
            <TenantPdcSummary agreement_id={agreement_id} />

            <TenantLeasePayments agreement_id={agreement_id} />
        </div>
    ) : (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 pt-16 pb-3 md:pt-6 md:pb-3 px-3 md:px-8 lg:px-12 xl:px-16">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                        <svg
                            className="w-5 h-5 text-white"
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
                        <h1 className="text-lg font-bold text-gray-900">Error</h1>
                        <p className="text-gray-500 text-xs">No agreement ID provided</p>
                    </div>
                </div>
            </div>
            <div className="px-3 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-amber-700 text-sm font-medium">
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
            <div className="bg-white border-b border-gray-200 pt-16 pb-3 md:pt-6 md:pb-3 px-3 md:px-8 lg:px-12 xl:px-16">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                    <div>
                        <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-1.5" />
                        <div className="h-3 bg-gray-200 rounded w-52 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="px-3 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-200 p-4"
                        >
                            <div className="h-8 bg-gray-200 rounded w-14 animate-pulse mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-18 animate-pulse" />
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
