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
];

export default function PendingMaintenanceDonut({
    landlordId,
}: {
    landlordId?: string;
}) {
    const router = useRouter();

    const { data, error, isLoading } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
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

    const handleViewAll = () => {
        router.push("/landlord/maintenance");
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Maintenance Status</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Current open work orders</p>
                </div>
                <button
                    onClick={handleViewAll}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                    View All Requests
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                    Loading maintenance data…
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    Failed to load maintenance data
                </div>
            ) : (
                <>
                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-5 flex">
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

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {STATUS_CONFIG.map((s) => (
                            <div
                                key={s.key}
                                className="rounded-xl p-4 text-center border"
                                style={{ backgroundColor: s.bg, borderColor: s.color + "33" }}
                            >
                                <p className="text-xl font-bold" style={{ color: s.text }}>
                                    {counts[s.key]}
                                </p>
                                <p
                                    className="text-[10px] font-semibold uppercase mt-1 tracking-wide"
                                    style={{ color: s.text + "B3" }}
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
