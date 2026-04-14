"use client";

import { useParams } from "next/navigation";
import { Zap, Droplets } from "lucide-react";

import ConcessionaireBillingHistory from "@/components/landlord/properties/ConcessionaireBillingHistory";

export default function UtilityHistoryPage() {
    const { id } = useParams();
    const property_id = id as string;

    return (
        <div className="min-h-screen w-full max-w-none bg-gray-50 pb-24 md:pb-6 overflow-x-hidden">
            <div className="w-full px-4 md:px-6 pt-20 md:pt-6">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                        {/* Title */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5 text-white" />
                            </div>

                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                    Utility Cost History
                                </h1>
                                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                    Review historical water and electricity costs for this property
                                </p>
                            </div>
                        </div>

                        {/* Legend (context only, no logic) */}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Droplets className="w-3.5 h-3.5" />
                Water
              </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Zap className="w-3.5 h-3.5" />
                Electricity
              </span>
                        </div>

                    </div>
                </div>

                {/* ================= CONTENT ================= */}
                <div className="bg-white w-full rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <ConcessionaireBillingHistory propertyId={property_id} />
                </div>

            </div>
        </div>
    );
}
