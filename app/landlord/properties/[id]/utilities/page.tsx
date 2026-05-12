"use client";

import { useParams } from "next/navigation";
import { Zap, Droplets } from "lucide-react";

import ConcessionaireBillingHistory from "@/components/landlord/properties/ConcessionaireBillingHistory";
import UtilityCostTrendChart from "@/components/landlord/analytics/perProperty/UtilityCostTrendChart";

export default function UtilityHistoryPage() {
    const { id } = useParams();
    const property_id = id as string;

    return (
        <div className="min-h-screen w-full bg-gray-50 pb-24 md:pb-6">
            <div className="w-full px-3 md:px-6 pt-4 md:pt-6 space-y-4 md:space-y-6">

                {/* ================= HEADER ================= */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base md:text-2xl font-bold text-gray-900 leading-tight">
                                Utility Cost History
                            </h1>
                            <p className="text-[10px] md:text-sm text-gray-500 mt-0.5">
                                Historical water & electricity costs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] md:text-xs">
                            <Droplets className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                            <span className="hidden md:inline">Water</span>
                            <span className="md:hidden">H₂O</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] md:text-xs">
                            <Zap className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                            Electricity
                        </span>
                    </div>
                </div>

                {/* ================= CHART ================= */}
                <div className="bg-white w-full rounded-lg border border-gray-200 shadow-sm overflow-hidden p-3 md:p-4">
                    <UtilityCostTrendChart propertyId={property_id} />
                </div>

                {/* ================= TABLES ================= */}
                <div className="bg-white w-full rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <ConcessionaireBillingHistory propertyId={property_id} />
                </div>

            </div>
        </div>
    );
}
