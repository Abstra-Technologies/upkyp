"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

interface Props {
    landlord_id: string;
    onClick?: () => void;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function formatCurrency(amount: number): string {
    if (amount === 0) return "₱0";
    if (amount < 1000) return `₱${amount.toLocaleString()}`;
    if (amount < 10000) return `₱${(amount / 1000).toFixed(1)}k`;
    return `₱${(amount / 1000).toFixed(1)}k`;
}

function calcChange(current: number, previous: number): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.round(change * 10) / 10, isPositive: change >= 0 };
}

export default function PaymentSummaryCard({ landlord_id, onClick }: Props) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    const { data: propertyResponse, isLoading: propertiesLoading } = useSWR(
        landlord_id ? `/api/landlord/${landlord_id}/properties` : null,
        fetcher,
        { revalidateOnFocus: true, refreshInterval: 60000 },
    );

    const { data: yearsData } = useSWR(
        landlord_id ? `/api/landlord/payments/years?landlord_id=${landlord_id}` : null,
        fetcher,
        { revalidateOnFocus: false },
    );

    const properties = propertyResponse?.data ?? [];
    const availableYears = yearsData?.years ?? [currentYear];

    const currentMonthNum = currentMonth + 1;
    const prevMonthNum = prevMonth + 1;
    const currentMonthDays = new Date(currentYear, currentMonthNum, 0).getDate();
    const prevMonthDays = new Date(prevYear, prevMonthNum, 0).getDate();

    /* Current month receivables */
    const currentStatsKey = landlord_id
        ? `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}${selectedPropertyId !== "all" ? `&property_id=${selectedPropertyId}` : ""}&month=${currentMonthNum}&year=${currentYear}`
        : null;

    const { data: currentStats, isLoading: statsLoading } = useSWR(currentStatsKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 30000,
    });

    /* Previous month receivables (for comparison) */
    const prevStatsKey = landlord_id
        ? `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}${selectedPropertyId !== "all" ? `&property_id=${selectedPropertyId}` : ""}&month=${prevMonthNum}&year=${prevYear}`
        : null;

    const { data: prevStats } = useSWR(prevStatsKey, fetcher, {
        revalidateOnFocus: false,
    });

    /* Current month expenses */
    const currentExpensesKey = landlord_id
        ? `/api/landlord/expenses${selectedPropertyId !== "all" ? `?property_id=${selectedPropertyId}` : ""}&start_date=${currentYear}-${String(currentMonthNum).padStart(2, "0")}-01&end_date=${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${currentMonthDays}&page=1&limit=1`
        : null;

    const { data: currentExpensesData } = useSWR(currentExpensesKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 60000,
    });

    /* Previous month expenses */
    const prevExpensesKey = landlord_id
        ? `/api/landlord/expenses${selectedPropertyId !== "all" ? `?property_id=${selectedPropertyId}` : ""}&start_date=${prevYear}-${String(prevMonthNum).padStart(2, "0")}-01&end_date=${prevYear}-${String(prevMonthNum).padStart(2, "0")}-${prevMonthDays}&page=1&limit=1`
        : null;

    const { data: prevExpensesData } = useSWR(prevExpensesKey, fetcher, {
        revalidateOnFocus: false,
    });

    /* Occupancy rate */
    const occupancyKey = landlord_id
        ? `/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}${selectedPropertyId !== "all" ? `&property_id=${selectedPropertyId}` : ""}`
        : null;

    const { data: occupancyData } = useSWR(occupancyKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 60000,
    });

    /* Maintenance statuses */
    const maintenanceKey = landlord_id
        ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlord_id}${selectedPropertyId !== "all" ? `&property_id=${selectedPropertyId}` : ""}`
        : null;

    const { data: maintenanceData } = useSWR(maintenanceKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 60000,
    });

    const collected = Math.round(currentStats?.total_collected || 0);
    const pending = Math.round(currentStats?.total_pending || 0);
    const overdue = Math.round(currentStats?.total_overdue || 0);
    const total = collected + pending + overdue;

    const prevCollected = Math.round(prevStats?.total_collected || 0);

    const currentExpenses = currentExpensesData?.summary?.reduce((sum: number, cat: any) => sum + Number(cat.total_amount || 0), 0) || 0;
    const prevExpenses = prevExpensesData?.summary?.reduce((sum: number, cat: any) => sum + Number(cat.total_amount || 0), 0) || 0;

    const netIncome = collected - currentExpenses;
    const prevNetIncome = prevCollected - prevExpenses;
    const netIncomeChange = calcChange(netIncome, prevNetIncome);

    const occupancyRate = Math.round(occupancyData?.occupancyRate || 0);
    const prevOccupancyRate = Math.round(occupancyData?.prevOccupancyRate || occupancyRate);
    const occupancyChange = calcChange(occupancyRate, prevOccupancyRate);

    const maintenanceCounts = maintenanceData?.data || {};
    const openWorkOrders = (maintenanceCounts["pending"] || 0) + (maintenanceCounts["approved"] || 0) + (maintenanceCounts["scheduled"] || 0) + (maintenanceCounts["in-progress"] || 0);
    const prevOpenWorkOrders = maintenanceData?.prevData ? 
        (maintenanceData.prevData["pending"] || 0) + (maintenanceData.prevData["approved"] || 0) + (maintenanceData.prevData["scheduled"] || 0) + (maintenanceData.prevData["in-progress"] || 0) : openWorkOrders;
    const workOrderChange = openWorkOrders - prevOpenWorkOrders;

    const monthLabel = `${MONTHS[currentMonth]} ${currentYear}`;

    const chartOptions = useMemo(
        () => ({
            chart: { type: "donut" as const, toolbar: { show: false }, sparkline: { enabled: true } },
            labels: ["Collected", "Upcoming", "Overdue"],
            colors: ["#10B981", "#3B82F6", "#F97316"],
            legend: { show: false },
            dataLabels: { enabled: false },
            stroke: { width: 3, colors: ["#fff"] },
            plotOptions: {
                pie: {
                    donut: {
                        size: "78%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Expected",
                                fontSize: "11px",
                                color: "#6B7280",
                                fontWeight: 500,
                                formatter: () => formatCurrency(total),
                            },
                            value: {
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "#111827",
                                formatter: (val: string) => formatCurrency(Number(val)),
                            },
                        },
                    },
                },
            },
        }),
        [total],
    );

    const series = useMemo(() => (total > 0 ? [collected, pending, overdue] : [1]), [collected, pending, overdue, total]);

    const incomeBars = [60, 65, 70, 75, 80, 85];
    const occupancyBars = [85, 88, 90, 92, 93, 94];
    const workOrderBars = [15, 14, 13, 13, 12, 12];

    return (
        <div onClick={onClick} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Portfolio Performance</h2>
                    <p className="text-sm text-blue-600 font-semibold">{monthLabel}</p>
                </div>
                <div className="relative">
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        disabled={propertiesLoading}
                        className="appearance-none text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2 cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <option value="all">All Properties</option>
                        {properties.map((property: any) => (
                            <option key={property.property_id} value={property.property_id}>
                                {property.property_name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Content Row */}
            <div className="flex items-center gap-6 flex-1">
                {/* Left: Donut + Badges */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Donut */}
                    <div className="w-24 h-24 shrink-0">
                        {statsLoading ? (
                            <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />
                        ) : (
                            <Chart options={chartOptions} series={series} type="donut" width="100%" height="100%" />
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-xs font-semibold text-emerald-600 mb-1">Collected</p>
                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(collected)}</p>
                        </div>
                        <div className="flex-1 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                            <p className="text-xs font-semibold text-blue-600 mb-1">Upcoming</p>
                            <p className="text-lg font-bold text-blue-700">{formatCurrency(pending)}</p>
                        </div>
                        <div className="flex-1 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                            <p className="text-xs font-semibold text-orange-600 mb-1">Overdue</p>
                            <p className="text-lg font-bold text-orange-700">{formatCurrency(overdue)}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-24 bg-gray-200 shrink-0" />

                {/* Right: Metrics from API */}
                <div className="flex items-center gap-8 flex-1">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Net Income</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${netIncomeChange.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {netIncomeChange.isPositive ? '+' : ''}{netIncomeChange.value}%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(netIncome)}</p>
                        <div className="flex items-end gap-1 h-6">
                            {incomeBars.map((v, i) => (
                                <div key={i} className="flex-1 rounded-sm bg-emerald-400" style={{ height: `${v}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Occupancy Rate</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${occupancyChange.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {occupancyChange.isPositive ? '+' : ''}{occupancyChange.value}%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{occupancyRate}%</p>
                        <div className="flex items-end gap-1 h-6">
                            {occupancyBars.map((v, i) => (
                                <div key={i} className="flex-1 rounded-sm bg-purple-400" style={{ height: `${v}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Open Work Orders</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${workOrderChange <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {workOrderChange <= 0 ? '' : '+'}{workOrderChange}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{openWorkOrders}</p>
                        <div className="flex items-end gap-1 h-6">
                            {workOrderBars.map((v, i) => (
                                <div key={i} className="flex-1 rounded-sm bg-amber-400" style={{ height: `${v}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
