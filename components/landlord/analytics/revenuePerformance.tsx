"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import { Calendar, DollarSign, ArrowUpRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    CARD_CONTAINER_INTERACTIVE,
    EMPTY_STATE_ICON,
    SECTION_HEADER,
    GRADIENT_DOT,
    SECTION_TITLE,
} from "@/constant/design-constants";

/* ---------------- ApexCharts ---------------- */
const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
    loading: () => (
        <div className="h-[260px] md:h-[320px] bg-gray-100 rounded-lg animate-pulse" />
    ),
});

/* ---------------- Constants ---------------- */
const ALL_MONTHS = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
];

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface RevenueData {
    month: string;
    revenue: number;
}

interface YearsApiResponse {
    firstYear: number | null;
    currentYear: number;
}

interface Property {
    property_id: string;
    property_name: string;
}

export default function RevenuePerformanceChart() {
    const router = useRouter();

    /* ---------------- PROPERTIES ---------------- */
    const { data: propertiesData } = useSWR<Property[]>(
        "/api/landlord/properties/getAllPropertieName",
        fetcher,
        { revalidateOnFocus: false }
    );

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    /* ---------------- YEARS ---------------- */
    const { data: yearsData } = useSWR<YearsApiResponse>(
        selectedPropertyId !== "all"
            ? `/api/landlord/payments/years?property_id=${selectedPropertyId}`
            : `/api/landlord/payments/years`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const years = useMemo(() => {
        if (!yearsData?.firstYear) return [];
        const list: number[] = [];
        for (let y = yearsData.currentYear; y >= yearsData.firstYear; y--) {
            list.push(y);
        }
        return list;
    }, [yearsData]);

    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedYear && years.length) {
            setSelectedYear(years[0]);
        }
    }, [years, selectedYear]);

    /* ---------------- REVENUE DATA ---------------- */
    const { data = [], isLoading } = useSWR<RevenueData[]>(
        selectedYear
            ? `/api/analytics/landlord/getRevenuePerformance?year=${selectedYear}${selectedPropertyId !== "all" ? `&propertyId=${selectedPropertyId}` : ""}`
            : null,
        fetcher,
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    /* ---------------- NORMALIZE MONTHS ---------------- */
    const chartData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach((d) => map.set(d.month, Number(d.revenue) || 0));

        return ALL_MONTHS.map((month) => ({
            month,
            revenue: map.get(month) ?? 0,
        }));
    }, [data]);

    const hasValidData = chartData.some((d) => d.revenue > 0);

    /* ---------------- Format Currency ---------------- */
    const formatCurrency = (val: number) => {
        if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}K`;
        return `₱${val.toLocaleString()}`;
    };

    const series = [
        { name: "Revenue", data: chartData.map((d) => d.revenue) },
    ];

    const baseOptions = {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        xaxis: {
            categories: ALL_MONTHS,
            labels: { style: { fontSize: "12px", colors: "#6b7280" } },
        },
        yaxis: {
            labels: {
                formatter: formatCurrency,
                style: { colors: "#6b7280" },
            },
        },
        tooltip: { y: { formatter: formatCurrency } },
        grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
        colors: ["#10b981"],
        dataLabels: { enabled: false },
    };

    const selectedPropertyName = selectedPropertyId === "all"
        ? "All Properties"
        : propertiesData?.find((p) => p.property_id === selectedPropertyId)?.property_name || "";

    return (
        <div
            onClick={() =>
                router.push("/landlord/analytics/detailed/revenue")
            }
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        Overall Revenue Performance
                    </h2>
                    <p className="text-lg font-semibold text-gray-700">
                        {selectedPropertyName} · {selectedYear ?? ""}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Property Selector */}
                    {propertiesData && propertiesData.length > 0 && (
                        <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="appearance-none text-sm font-medium text-gray-700 bg-gray-50 border rounded-lg pl-3 pr-10 py-2 cursor-pointer focus:outline-none"
                            >
                                <option value="all">All Properties</option>
                                {propertiesData.map((property) => (
                                    <option key={property.property_id} value={property.property_id}>
                                        {property.property_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    {/* Year Selector */}
                    {years.length > 0 && selectedYear && (
                        <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(Number(e.target.value))
                                }
                                className="appearance-none text-sm font-medium text-gray-700 bg-gray-50 border rounded-lg pl-3 pr-10 py-2 cursor-pointer focus:outline-none"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* ================= CHART ================= */}
            <Chart
                type="bar"
                height={320}
                series={series}
                options={{
                    ...baseOptions,
                    plotOptions: {
                        bar: { columnWidth: "50%", borderRadius: 8 },
                    },
                }}
            />

            {/* ================= EMPTY ================= */}
            {!hasValidData && !isLoading && (
                <div className="text-center py-8 mt-4 border-t border-gray-100">
                    <div className={EMPTY_STATE_ICON}>
                        <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                        No revenue recorded yet
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Revenue will appear once tenants start making payments.
                    </p>
                </div>
            )}

            {/* ================= HOVER REDIRECT LABEL ================= */}
            <div className="
        pointer-events-none
        absolute bottom-4 right-4
        opacity-0 translate-y-2
        group-hover:opacity-100 group-hover:translate-y-0
        transition-all duration-200
      ">
                <div className="
          flex items-center gap-1.5
          text-xs font-medium
          text-gray-700
          bg-white/90 backdrop-blur
          px-3 py-1.5
          rounded-full
          shadow-md border
        ">
                    View detailed revenue
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}