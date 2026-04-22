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

    const startDate =
        billingData?.period_start &&
        !isNaN(new Date(billingData.period_start).getTime())
            ? new Date(billingData.period_start)
            : null;

    const endDate =
        billingData?.period_end &&
        !isNaN(new Date(billingData.period_end).getTime())
            ? new Date(billingData.period_end)
            : null;

    const formattedRange =
        startDate && endDate
            ? `${startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })} – ${endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            })}`
            : null;

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
                className="w-full text-left rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3 mb-4 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">Rates Set ({monthYear})</p>
                            <p className="text-[10px] text-gray-500">Click to update rates</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                    {hasElectricity && electricityRate > 0 && (
                        <div className="flex-1 bg-white rounded-lg border border-amber-200 px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span className="text-[10px] font-semibold text-gray-600">Elec</span>
                                <span className="text-xs font-bold text-amber-600">₱{electricityRate.toFixed(2)}/kWh</span>
                            </div>
                        </div>
                    )}
                    
                    {hasWater && waterRate > 0 && (
                        <div className="flex-1 bg-white rounded-lg border border-blue-200 px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                                <Droplet className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-semibold text-gray-600">Water</span>
                                <span className="text-xs font-bold text-blue-600">₱{waterRate.toFixed(2)}/m³</span>
                            </div>
                        </div>
                    )}
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={() => setIsModalOpen(true)}
            className="w-full text-left rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 mb-4 shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-900">
                        Rates Not Set
                    </p>
                    <p className="text-[10px] text-gray-500">
                        Configure to enable billing
                    </p>
                </div>
            </div>
        </button>
    );
}
