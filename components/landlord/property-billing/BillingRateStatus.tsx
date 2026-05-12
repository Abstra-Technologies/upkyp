"use client";

import { CheckCircle, AlertCircle, Zap, Droplet } from "lucide-react";

export default function BillingRateStatus({
    propertyDetails,
    hasBillingForMonth,
    billingData,
    setIsModalOpen,
}: any) {
    if (
        !propertyDetails ||
        (propertyDetails.water_billing_type !== "submetered" &&
            propertyDetails.electricity_billing_type !== "submetered")
    )
        return null;

    const electricityConsumption = billingData?.electricity?.consumption || 0;
    const electricityTotal = billingData?.electricity?.total || 0;
    const electricityRate = electricityConsumption > 0 && electricityTotal > 0 
        ? electricityTotal / electricityConsumption 
        : 0;

    const waterConsumption = billingData?.water?.consumption || 0;
    const waterTotal = billingData?.water?.total || 0;
    const waterRate = waterConsumption > 0 && waterTotal > 0 
        ? waterTotal / waterConsumption 
        : 0;

    const hasElectricity = propertyDetails.electricity_billing_type === "submetered";
    const hasWater = propertyDetails.water_billing_type === "submetered";

    const monthYear = billingData?.created_at 
        ? new Date(billingData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (hasBillingForMonth && (electricityRate > 0 || waterRate > 0)) {
        return (
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 sm:p-3 hover:bg-emerald-100 transition-colors text-left"
            >
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                        <span className="text-[9px] sm:text-sm font-bold text-emerald-800 truncate">Rates set</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        {hasElectricity && electricityRate > 0 && (
                            <span className="text-[8px] sm:text-xs bg-white/70 text-amber-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-medium whitespace-nowrap">
                                <Zap className="w-2 h-2 sm:w-3 sm:h-3 inline mr-0.5" />
                                ₱{electricityRate.toFixed(2)}
                            </span>
                        )}
                        {hasWater && waterRate > 0 && (
                            <span className="text-[8px] sm:text-xs bg-white/70 text-blue-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-medium whitespace-nowrap">
                                <Droplet className="w-2 h-2 sm:w-3 sm:h-3 inline mr-0.5" />
                                ₱{waterRate.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-lg border border-amber-200 bg-amber-50 p-1.5 sm:p-3 hover:bg-amber-100 transition-colors text-left"
        >
            <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                    <span className="text-[9px] sm:text-sm font-bold text-amber-800 truncate">Set rates</span>
                </div>
                <span className="text-[8px] sm:text-xs text-amber-600 font-medium whitespace-nowrap shrink-0">Config →</span>
            </div>
        </button>
    );
}