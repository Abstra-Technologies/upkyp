"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import useSWR from "swr";
import axios from "axios";
import { Wrench, Clock, AlertTriangle } from "lucide-react";
import {
    CARD_CONTAINER_INTERACTIVE,
    SECTION_HEADER,
    GRADIENT_DOT,
    SECTION_TITLE,
} from "@/constant/design-constants";

/* --------------------------------------------------
   Fetcher
-------------------------------------------------- */
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

/* --------------------------------------------------
   Status config (UI-driven)
-------------------------------------------------- */
const STATUS_CONFIG = [
    { key: "pending", label: "Pending", color: "#F59E0B" },
    { key: "approved", label: "Approved", color: "#3B82F6" },
    { key: "scheduled", label: "Scheduled", color: "#06B6D4" },
    { key: "in-progress", label: "In Progress", color: "#8B5CF6" },
    { key: "completed", label: "Completed", color: "#10B981" },
];

/* --------------------------------------------------
   Component
-------------------------------------------------- */
export default function PendingMaintenanceDonut({
                                                    landlordId,
                                                }: {
    landlordId?: string;
}) {
    /* ---------------- Primary data ---------------- */
    const {
        data: statusData,
        error: statusError,
        isLoading: statusLoading,
    } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            fallbackData: {},
        }
    );

    /* ---------------- Secondary data ---------------- */
    const { data: todayWorkOrders } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getTodayMaintenance?landlord_id=${landlordId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 120_000,
        }
    );

    /* ---------------- Derived ---------------- */
    const donutData = useMemo(
        () =>
            STATUS_CONFIG.map((s) => ({
                key: s.key,
                name: s.label,
                color: s.color,
                value: Number(statusData?.data?.[s.key] ?? statusData?.[s.key] ?? 0),
            })),
        [statusData]
    );

    const total = useMemo(
        () => donutData.reduce((sum, s) => sum + s.value, 0),
        [donutData]
    );

    const isAllZero = total === 0;

    /* --------------------------------------------------
       UI
    -------------------------------------------------- */
    return (
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col hover:shadow-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Maintenance Overview</h2>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{total} total</span>
            </div>

            {/* Loading / Error */}
            {statusLoading && (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                    Loading maintenance data…
                </div>
            )}

            {statusError && (
                <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    Failed to load maintenance data
                </div>
            )}

            {!statusLoading && !statusError && (
                <>
                    {/* Chart + Legend */}
                    <div className="flex items-center justify-center gap-6 mb-4 min-h-[140px]">
                        {/* Chart */}
                        {!isAllZero ? (
                            <PieChart width={120} height={120}>
                                <Pie
                                    data={donutData}
                                    dataKey="value"
                                    innerRadius={40}
                                    outerRadius={55}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {donutData.map((d) => (
                                        <Cell key={d.key} fill={d.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        ) : (
                            <div className="w-[120px] h-[120px] rounded-full border-4 border-gray-200 flex items-center justify-center shadow-inner">
                                <Wrench className="w-6 h-6 text-gray-400" />
                            </div>
                        )}

                        {/* Legend */}
                        <div className="flex flex-col gap-2">
                            {!isAllZero ? (
                                donutData.map((item) => (
                                    <div key={item.key} className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                                        <span className="text-xs text-gray-700">
                      {item.name} ({item.value})
                    </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500">
                                    No maintenance requests
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Today's Work */}
                    <div className="border-t border-gray-100 pt-3 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Today&apos;s Scheduled Work
                            </h3>
                        </div>

                        {!todayWorkOrders || todayWorkOrders.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">
                                No work scheduled today
                            </p>
                        ) : (
                            <div className="space-y-2 overflow-y-auto flex-1">
                                {todayWorkOrders.map((work: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg
                      transition-all duration-200
                      hover:bg-blue-50 hover:border-blue-200 hover:shadow-md"
                                    >
                                        <p className="font-medium text-xs text-gray-900">
                                            {work.subject}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {work.unit_name ?? "Property-level"} •{" "}
                                            {work.schedule_time}
                                        </p>
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
