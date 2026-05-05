"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { AlertTriangle, ArrowRight } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const STATUS_CONFIG = [
    { key: "pending", label: "Pending", color: "#F59E0B", bg: "#FFFBEB", text: "#B45309" },
    { key: "approved", label: "Approved", color: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8" },
    { key: "scheduled", label: "Scheduled", color: "#06B6D4", bg: "#ECFEFF", text: "#0E7490" },
    { key: "in-progress", label: "In Progress", color: "#8B5CF6", bg: "#F5F3FF", text: "#6D28D9" },
    { key: "completed", label: "Completed", color: "#10B981", bg: "#ECFDF5", text: "#047857" },
    { key: "rejected", label: "Rejected", color: "#EF4444", bg: "#FEF2F2", text: "#B91C1C" },
];

export default function PendingMaintenanceDonut({
    landlordId,
}: {
    landlordId?: string;
}) {
    const router = useRouter();

    const { data, error, isLoading } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getMaintenanceStatuses`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000, fallbackData: {} },
    );

    const counts = useMemo(() => {
        const result: Record<string, number> = {};
        for (const s of STATUS_CONFIG) {
            result[s.key] = Number(data?.data?.[s.key] ?? data?.[s.key] ?? 0);
        }
        return result;
    }, [data]);

    const total = useMemo(
        () => Object.values(counts).reduce((sum, c) => sum + c, 0),
        [counts],
    );

    const openTotal = useMemo(
        () => counts.pending + counts.approved + counts.scheduled + counts["in-progress"],
        [counts],
    );

    const handleViewAll = () => {
        router.push("/landlord/maintenance");
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-sm lg:text-base font-semibold text-gray-900">Maintenance</h2>
                    <p className="text-[10px] lg:text-xs text-gray-500">{openTotal} open requests</p>
                </div>
                <button
                    onClick={handleViewAll}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                    View All
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {isLoading ? (
                <div className="py-8 text-center text-xs text-gray-500">Loading...</div>
            ) : error ? (
                <div className="py-8 text-center text-xs text-red-500 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Failed to load
                </div>
            ) : (
                <>
                    <div className="w-full h-2 bg-gray-200 overflow-hidden flex">
                        {total > 0 ? (
                            STATUS_CONFIG.map((s) =>
                                counts[s.key] > 0 ? (
                                    <div
                                        key={s.key}
                                        className="transition-all duration-500"
                                        style={{
                                            backgroundColor: s.color,
                                            width: `${(counts[s.key] / total) * 100}%`,
                                        }}
                                    />
                                ) : null,
                            )
                        ) : (
                            <div className="w-full bg-gray-200" />
                        )}
                    </div>

                    <div className="px-3 py-3 grid grid-cols-3 lg:grid-cols-6 gap-2">
                        {STATUS_CONFIG.map((s) => (
                            <div
                                key={s.key}
                                className="rounded-lg px-2 py-2 text-center border"
                                style={{ backgroundColor: s.bg, borderColor: s.color + "33" }}
                            >
                                <p className="text-base font-bold" style={{ color: s.text }}>
                                    {counts[s.key]}
                                </p>
                                <p
                                    className="text-[9px] lg:text-[10px] font-medium uppercase mt-0.5"
                                    style={{ color: s.text }}
                                >
                                    {s.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}