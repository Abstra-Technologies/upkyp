"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { AlertTriangle, ArrowRight, Clock, CheckCircle, CalendarClock, Play, XCircle, MapPin, User } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const STATUS_CONFIG = [
    { key: "pending", label: "Pending", color: "#F59E0B", bg: "#FFFBEB", text: "#B45309", icon: Clock },
    { key: "approved", label: "Approved", color: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8", icon: CheckCircle },
    { key: "scheduled", label: "Scheduled", color: "#06B6D4", bg: "#ECFEFF", text: "#0E7490", icon: CalendarClock },
    { key: "in-progress", label: "In Progress", color: "#8B5CF6", bg: "#F5F3FF", text: "#6D28D9", icon: Play },
    { key: "completed", label: "Completed", color: "#10B981", bg: "#ECFDF5", text: "#047857", icon: CheckCircle },
    { key: "rejected", label: "Rejected", color: "#EF4444", bg: "#FEF2F2", text: "#B91C1C", icon: XCircle },
];

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    urgent: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Urgent" },
    high: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", label: "High" },
    medium: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400", label: "Medium" },
    low: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-400", label: "Low" },
};

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

    const { data: pendingData, isLoading: pendingLoading } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getPendingMaintenanceRequests`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000, fallbackData: { data: [] } },
    );

    const counts = useMemo(() => {
        const result: Record<string, number> = {};
        for (const s of STATUS_CONFIG) {
            result[s.key] = Number(data?.data?.[s.key] ?? data?.[s.key] ?? 0);
        }
        return result;
    }, [data]);

    const pendingRequests = useMemo(() => pendingData?.data || [], [pendingData]);

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

    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG.find(s => s.key === status);
        if (!config) return null;
        const Icon = config.icon;
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: config.bg, color: config.text }}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const p = priority?.toLowerCase() || "low";
        const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.low;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${config.bg} ${config.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5">
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
                    {/* Progress Bar */}
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

                    {/* Status Counts Grid */}
                    <div className="px-3 py-3 grid grid-cols-3 lg:grid-cols-6 gap-2">
                        {STATUS_CONFIG.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={s.key}
                                    className="rounded-lg px-2 py-2 text-center border cursor-pointer transition-all duration-200 hover:scale-[1.05] hover:shadow-md hover:border-transparent"
                                    style={{ backgroundColor: s.bg, borderColor: s.color + "33" }}
                                >
                                    <div className="flex items-center justify-center gap-1 mb-0.5">
                                        <Icon className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" style={{ color: s.text }} />
                                        <p className="text-base font-bold" style={{ color: s.text }}>
                                            {counts[s.key]}
                                        </p>
                                    </div>
                                    <p
                                        className="text-[9px] lg:text-[10px] font-medium uppercase mt-0.5"
                                        style={{ color: s.text }}
                                    >
                                        {s.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pending Requests List */}
                    <div className="border-t border-gray-100 px-3 py-3">
                        <h3 className="text-xs font-semibold text-gray-700 mb-2">Open Requests</h3>
                        
                        {pendingLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pendingRequests.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">No open maintenance requests</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {pendingRequests.map((req: any) => (
                                    <div
                                        key={req.request_id}
                                        className="p-2.5 rounded-lg border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 hover:bg-white group"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {req.subject}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <MapPin className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                                                        {req.property_name || "—"}
                                                    </span>
                                                    {req.unit_name && (
                                                        <span className="text-[10px] text-gray-400">• {req.unit_name}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {getStatusBadge(req.status)}
                                                {getPriorityBadge(req.priority_level)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-50">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <User className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                                                {req.tenant_name || "Unassigned"}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
