"use client";

import { useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { HardDrive, Clock, Calculator, TrendingUp } from "lucide-react";

interface SubscriptionData {
    plan_name: string;
    plan_code: string;
    price: number;
    billing_cycle: string;
    limits: {
        maxStorage: string | null;
        maxAssetsPerProperty: number | null;
        financialHistoryYears: number | null;
    };
    unitPricesByType: Record<string, number>;
}

interface StorageData {
    total_bytes: number;
}

interface PropertyData {
    property_id: number;
    property_type: string;
    total_units: number;
    units: { unit_id: number; property_type?: string }[];
}

interface Props {
    landlordId: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function CircleIndicator({ value, max, label, colorClass }: {
    value: number;
    max: number;
    label: string;
    colorClass: string;
}) {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="6"
                    />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={`transition-all duration-700 ${colorClass}`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">₱{value.toLocaleString()}</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[9px] text-gray-500">{label}</p>
                <p className="text-[10px] font-semibold text-gray-700">of ₱{max.toLocaleString()}</p>
            </div>
        </div>
    );
}

function UsageBar({ current, max, label, icon: Icon, colorClass, unit }: {
    current: number;
    max: number | null;
    label: string;
    icon: React.ElementType;
    colorClass: string;
    unit?: string;
}) {
    const numericMax = max !== null ? max : null;
    const percentage = !numericMax ? 0 : Math.min((current / numericMax) * 100, 100);
    const isNearLimit = numericMax !== null && percentage >= 80;

    return (
        <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-semibold text-gray-900">
                        {current}{unit ? ` ${unit}` : ""}
                        {numericMax !== null && (
                            <span className="text-gray-500"> / {numericMax}{unit ? ` ${unit}` : ""}</span>
                        )}
                    </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            isNearLimit ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {isNearLimit && (
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-red-500 font-medium">
                            {Math.round(percentage)}% used
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SubscriptionUsageCard({ landlordId }: Props) {
    const { data: subscription, isLoading: subLoading } = useSWR<SubscriptionData>(
        landlordId ? `/api/landlord/subscription/active/${landlordId}` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const { data: storageData, isLoading: storageLoading } = useSWR<StorageData>(
        `/api/landlord/storage/usage`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const { data: propertiesData, isLoading: propsLoading } = useSWR<{ data: PropertyData[] }>(
        `/api/landlord/properties/getAllProperties`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const isLoading = subLoading || storageLoading || propsLoading;

    const stats = useMemo(() => {
        if (!propertiesData?.data) return { totalUnits: 0, unitsByPropertyType: {} as Record<string, number> };

        const properties = propertiesData.data;
        const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);

        const unitsByPropertyType: Record<string, number> = {};
        properties.forEach((p) => {
            const type = p.property_type || "residential";
            const unitCount = p.total_units || 0;
            unitsByPropertyType[type] = (unitsByPropertyType[type] || 0) + unitCount;
        });

        return { totalUnits, unitsByPropertyType };
    }, [propertiesData]);

    const storageGB = useMemo(() => {
        if (!storageData) return 0;
        return Number(storageData.total_bytes) / (1024 * 1024 * 1024);
    }, [storageData]);

    const spend = useMemo(() => {
        if (!subscription) return null;

        const basePrice = Number(subscription.price);
        const unitPrices = subscription.unitPricesByType || {};

        let totalUnitCost = 0;
        const breakdown: { type: string; count: number; pricePerUnit: number; subtotal: number }[] = [];

        for (const [type, count] of Object.entries(stats.unitsByPropertyType)) {
            const pricePerUnit = Number(unitPrices[type]) || 0;
            const subtotal = count * pricePerUnit;
            totalUnitCost += subtotal;
            breakdown.push({ type, count, pricePerUnit, subtotal });
        }

        const subtotal = Math.max(basePrice, totalUnitCost);

        return {
            basePrice,
            totalUnitCost,
            subtotal,
            breakdown,
        };
    }, [subscription, stats]);

    const parseStorageLimit = (limit: string | null): number | null => {
        if (!limit) return null;
        const match = limit.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    };

    const storageLimitGB = parseStorageLimit(subscription?.limits.maxStorage || null);

    return (
        <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-300">
            <div className="px-3 py-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-900">
                            {subscription?.plan_name || "No Plan"}
                        </h3>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="px-3 py-4">
                    <div className="animate-pulse space-y-2">
                        <div className="h-8 bg-gray-100 rounded-lg" />
                        <div className="h-8 bg-gray-100 rounded-lg" />
                        <div className="h-8 bg-gray-100 rounded-lg" />
                    </div>
                </div>
            ) : !subscription ? (
                <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-400">No active subscription</p>
                </div>
            ) : (
                <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Base Floor Price</p>
                            <p className="text-base font-bold text-gray-900">₱{spend?.basePrice.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Amount Payable:</p>
                            <p className="text-base font-bold text-blue-600">₱{spend?.subtotal.toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <h4 className="text-xs font-semibold text-gray-900">Usage Tracker</h4>
                        </div>

                        <div className="space-y-1 mb-2">
                            {Object.entries(stats.unitsByPropertyType).map(([type, count]) => {
                                const unitPrice = subscription?.unitPricesByType?.[type] || 0;
                                const lineTotal = count * Number(unitPrice);
                                return (
                                    <div key={type} className="flex items-center justify-between py-1.5 px-2 bg-white/60 rounded-md">
                                        <div>
                                            <span className="text-xs font-medium text-gray-700 capitalize">{type}</span>
                                            <p className="text-[9px] text-gray-500">{count} × ₱{Number(unitPrice).toLocaleString()}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900">₱{lineTotal.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {spend && (
                            <div className="flex justify-center py-1">
                                <CircleIndicator
                                    value={spend.totalUnitCost}
                                    max={spend.basePrice}
                                    label="Usage vs Floor"
                                    colorClass={spend.totalUnitCost >= spend.basePrice ? "stroke-emerald-500" : "stroke-blue-500"}
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <UsageBar
                            current={parseFloat(storageGB.toFixed(2))}
                            max={storageLimitGB}
                            label="Storage"
                            icon={HardDrive}
                            colorClass="bg-violet-50 text-violet-600"
                            unit="GB"
                        />
                    </div>

                    {subscription.limits.financialHistoryYears && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-sky-50 text-sky-600">
                                <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">Financial History</span>
                                    <span className="text-xs font-semibold text-gray-900">
                                        {subscription.limits.financialHistoryYears} years
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
