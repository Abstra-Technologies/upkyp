"use client";

import { useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { Building2, Users, Box, HardDrive, Clock, Calculator } from "lucide-react";

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
}

interface StorageData {
    total_bytes: number;
}

interface PropertyData {
    property_id: number;
    total_units: number;
    units: { unit_id: number; property_type?: string }[];
}

interface PlanPrice {
    price: number;
    unitPricesByType: Record<string, number>;
}

interface Props {
    landlordId: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function UsageBar({ current, max, label, icon: Icon, colorClass, unit }: {
    current: number | string;
    max: string | number | null;
    label: string;
    icon: React.ElementType;
    colorClass: string;
    unit?: string;
}) {
    const isUnlimited = max === null || max === "unlimited";
    const numericCurrent = typeof current === "number" ? current : 0;
    const numericMax = typeof max === "number" ? max : null;
    const percentage = isUnlimited || !numericMax ? 0 : Math.min((numericCurrent / numericMax) * 100, 100);
    const isNearLimit = !isUnlimited && numericMax !== null && percentage >= 80;

    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-semibold text-gray-900">
                        {current}{unit && typeof current === "number" ? ` ${unit}` : ""}
                        {!isUnlimited && numericMax !== null && (
                            <span className="text-gray-500"> / {numericMax}{unit ? ` ${unit}` : ""}</span>
                        )}
                        {isUnlimited && <span className="text-gray-400 ml-1">unlimited</span>}
                    </span>
                </div>
                {isUnlimited ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <span>Available</span>
                    </div>
                ) : (
                    <>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isNearLimit ? "bg-red-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        {isNearLimit && (
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-red-500 font-medium">
                                    {Math.round(percentage)}% used
                                </span>
                            </div>
                        )}
                    </>
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

    const { data: plansData, isLoading: plansLoading } = useSWR<PlanPrice[]>(
        `/api/systemadmin/subscription_programs/getPlans`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const isLoading = subLoading || storageLoading || propsLoading || plansLoading;

    const stats = useMemo(() => {
        if (!propertiesData?.data) return { totalProperties: 0, totalUnits: 0, totalAssets: 0, propertyTypeCounts: {} as Record<string, number> };

        const properties = propertiesData.data;
        const totalProperties = properties.length;
        const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);

        const propertyTypeCounts: Record<string, number> = {};
        properties.forEach((p) => {
            p.units?.forEach((u) => {
                const type = u.property_type || "residential";
                propertyTypeCounts[type] = (propertyTypeCounts[type] || 0) + 1;
            });
        });

        const totalAssets = Object.values(propertyTypeCounts).reduce((sum, count) => sum + count, 0);

        return { totalProperties, totalUnits, totalAssets, propertyTypeCounts };
    }, [propertiesData]);

    const storageMB = useMemo(() => {
        if (!storageData) return 0;
        return Number(storageData.total_bytes) / (1024 * 1024);
    }, [storageData]);

    const currentPlanPrice = useMemo(() => {
        if (!subscription || !plansData) return null;
        const plan = plansData.find((p) => p.price === Number(subscription.price));
        return plan || null;
    }, [subscription, plansData]);

    const spend = useMemo(() => {
        if (!subscription || !currentPlanPrice) return { basePrice: 0, unitCost: 0, subtotal: 0, appliedType: "base" };

        const basePrice = Number(currentPlanPrice.price);
        const unitPrices = currentPlanPrice.unitPricesByType || {};
        const primaryType = Object.keys(stats.propertyTypeCounts)[0] || "residential";
        const perUnitPrice = unitPrices[primaryType] || 0;
        const unitCost = stats.totalUnits * perUnitPrice;
        const subtotal = Math.max(basePrice, unitCost);

        return {
            basePrice,
            unitCost,
            subtotal,
            perUnitPrice,
            appliedType: unitCost >= basePrice ? "units" : "base",
            propertyType: primaryType,
        };
    }, [subscription, currentPlanPrice, stats]);

    const parseStorageLimit = (limit: string | null): number | null => {
        if (!limit) return null;
        const match = limit.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    };

    const storageLimitMB = parseStorageLimit(subscription?.limits.maxStorage || null);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            {subscription?.plan_name || "No Plan"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {subscription?.billing_cycle === "lifetime" ? "Lifetime" : `${subscription?.billing_cycle || "Monthly"} plan`}
                        </p>
                    </div>
                    {spend && (
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calculator className="w-3 h-3" />
                                <span>Current spend</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                ₱{spend.subtotal.toLocaleString()}
                                <span className="text-[10px] font-normal text-gray-500">/mo</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="px-4 py-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-10 bg-gray-100 rounded-lg" />
                        <div className="h-10 bg-gray-100 rounded-lg" />
                        <div className="h-10 bg-gray-100 rounded-lg" />
                        <div className="h-10 bg-gray-100 rounded-lg" />
                    </div>
                </div>
            ) : !subscription ? (
                <div className="px-4 py-6 text-center">
                    <p className="text-xs text-gray-400">No active subscription</p>
                </div>
            ) : (
                <div className="px-4 py-3 space-y-4">
                    <UsageBar
                        current={stats.totalProperties}
                        max={null}
                        label="Properties"
                        icon={Building2}
                        colorClass="bg-indigo-50 text-indigo-600"
                    />

                    <UsageBar
                        current={stats.totalUnits}
                        max={null}
                        label="Units"
                        icon={Users}
                        colorClass="bg-emerald-50 text-emerald-600"
                    />

                    <UsageBar
                        current={stats.totalAssets}
                        max={subscription.limits.maxAssetsPerProperty}
                        label="Assets per property"
                        icon={Box}
                        colorClass="bg-amber-50 text-amber-600"
                    />

                    <UsageBar
                        current={parseFloat(storageMB.toFixed(1))}
                        max={storageLimitMB}
                        label="Storage"
                        icon={HardDrive}
                        colorClass="bg-violet-50 text-violet-600"
                        unit="MB"
                    />

                    {subscription.limits.financialHistoryYears && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 text-sky-600">
                                <Clock className="w-4 h-4" />
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

                    {spend && spend.perUnitPrice > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
                                <div className="flex justify-between text-gray-600">
                                    <span>Base price</span>
                                    <span className="font-medium">₱{spend.basePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Unit cost ({stats.totalUnits} × ₱{spend.perUnitPrice})</span>
                                    <span className="font-medium">₱{spend.unitCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-700 font-semibold pt-1 border-t border-blue-200">
                                    <span>Applied ({spend.appliedType === "base" ? "base floor" : "unit pricing"})</span>
                                    <span>₱{spend.subtotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
