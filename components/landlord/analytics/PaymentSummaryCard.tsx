"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

interface Props {
    landlord_id: string;
    onClick?: () => void;
}

export default function PaymentSummaryCard({ landlord_id, onClick }: Props) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    const { data: propertyResponse, isLoading: propertiesLoading } = useSWR(
        landlord_id ? `/api/landlord/${landlord_id}/properties` : null,
        fetcher,
        { revalidateOnFocus: true, refreshInterval: 60000 }
    );

    const properties = propertyResponse?.data ?? [];

    const statsKey = landlord_id
        ? selectedPropertyId === "all"
            ? `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`
            : `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}&property_id=${selectedPropertyId}`
        : null;

    const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useSWR(statsKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 30000,
    });

    const { data: tenants = [], isLoading: tenantsLoading, mutate: mutateTenants } = useSWR(
        landlord_id
            ? selectedPropertyId === "all"
                ? `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`
                : `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}&property_id=${selectedPropertyId}`
            : null,
        fetcher,
        { revalidateOnFocus: true, refreshInterval: 60000 }
    );

    useEffect(() => {
        mutateStats();
        mutateTenants();
    }, [selectedPropertyId]);

    const collected = Math.round(stats?.total_collected || 0);
    const pending = Math.round(stats?.total_pending || 0);
    const overdue = Math.round(stats?.total_overdue || 0);
    const total = collected + pending + overdue;

    const monthLabel = useMemo(() => {
        const now = new Date();
        const month = now.toLocaleDateString("en-US", { month: "long" });
        const year = now.getFullYear();
        return `${month} ${year}`;
    }, []);

    const chartOptions = useMemo(
        () => ({
            chart: { type: "donut" as const, toolbar: { show: false } },
            labels: ["Paid", "Upcoming", "Overdue"],
            colors: ["#10b981", "#3b82f6", "#f97316"],
            legend: { show: false },
            dataLabels: { enabled: false },
            stroke: { width: 3, colors: ["#fff"] },
            plotOptions: {
                pie: {
                    donut: {
                        size: "85%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Total",
                                fontSize: "12px",
                                color: "#6b7280",
                                fontWeight: 500,
                                formatter: () => `₱${total.toLocaleString()}`,
                            },
                            value: {
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#111827",
                                formatter: (val: string) => `₱${Number(val).toLocaleString()}`,
                            },
                        },
                    },
                },
            },
        }),
        [total]
    );

    const series = useMemo(() => (total > 0 ? [collected, pending, overdue] : [1]), [collected, pending, overdue, total]);

    return (
        <div onClick={onClick} className="bg-gray-50/50 rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col hover:shadow-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Tenant Payments</h2>
                    <p className="text-xs text-blue-600 font-semibold">{monthLabel}</p>
                </div>
                <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={propertiesLoading}
                    className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer"
                >
                    <option value="all">All Properties</option>
                    {properties.map((property: any) => (
                        <option key={property.property_id} value={property.property_id}>
                            {property.property_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <StatItem label="Upcoming" value={pending} color="blue" loading={statsLoading} />
                <StatItem label="Overdue" value={overdue} color="orange" loading={statsLoading} />
                <StatItem label="Paid" value={collected} color="emerald" loading={statsLoading} />
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-[240px]">
                    {statsLoading ? (
                        <div className="w-full aspect-square rounded-full bg-gray-100 animate-pulse" />
                    ) : (
                        <Chart options={chartOptions} series={series} type="donut" width="100%" height="100%" />
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                {tenantsLoading ? (
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                ) : tenants.length > 0 ? (
                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {tenants.slice(0, 5).map((tenant: any) => (
                                <Link key={tenant.tenant_id} href={`/pages/landlord/list_of_tenants/${tenant.tenant_id}`}>
                                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm hover:scale-110 transition-transform">
                                        <Image
                                            src={tenant.profilePicture || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                            alt={tenant.firstName}
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                            ))}
                            {tenants.length > 5 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                    +{tenants.length - 5}
                                </div>
                            )}
                        </div>
                        <Link href="/pages/landlord/list_of_tenants" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center">No tenants yet</p>
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value, color, loading }: { label: string; value: number; color: "blue" | "orange" | "emerald"; loading: boolean }) {
    const colorMap = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };

    return (
        <div className={`p-2.5 rounded-xl ${colorMap[color]} border flex flex-col items-center text-center`}>
            <p className="text-[10px] font-medium opacity-80 mb-1">{label}</p>
            <p className="text-sm font-bold">
                {loading ? (
                    <span className="inline-block w-14 h-4 bg-gray-300 rounded animate-pulse" />
                ) : (
                    `₱${value.toLocaleString()}`
                )}
            </p>
        </div>
    );
}
