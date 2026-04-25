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
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100 transition-colors text-left"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-800">Rates set for {monthYear}</span>
                    </div>
                    <div className="flex gap-2">
                        {hasElectricity && electricityRate > 0 && (
                            <span className="text-xs bg-white/70 text-amber-700 px-2 py-1 rounded font-medium">
                                <Zap className="w-3 h-3 inline mr-1" />
                                ₱{electricityRate.toFixed(2)}
                            </span>
                        )}
                        {hasWater && waterRate > 0 && (
                            <span className="text-xs bg-white/70 text-blue-700 px-2 py-1 rounded font-medium">
                                <Droplet className="w-3 h-3 inline mr-1" />
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
            className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100 transition-colors text-left"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-800">Set rates for {monthYear}</span>
                </div>
                <span className="text-xs text-amber-600 font-medium">Tap to configure →</span>
            </div>
        </button>
    );
}