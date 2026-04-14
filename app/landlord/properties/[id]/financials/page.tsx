"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/utils/formatter/formatters";
import {
    ChevronDown,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    BarChart3,
    PlusCircle,
} from "lucide-react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export default function FinancialsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const landlordId = user?.landlord_id;

    const { subscription, loadingSubscription } =
        useSubscription(landlordId);

    const currentYear = new Date().getFullYear();
    const BASE_HISTORY_YEARS = 3;

    const [selectedYear, setSelectedYear] =
        useState(currentYear);

    const [showNOIChart, setShowNOIChart] =
        useState(false);

    const [showGrossChart, setShowGrossChart] =
        useState(false);

    /* ===============================
       SUBSCRIPTION-BASED ACCESS
    =============================== */

    const canUseFinancials =
        subscription?.features?.financialInsights === true;

    const allowedHistoryYears =
        subscription?.limits?.financialHistoryYears ?? null;

    const baseYears = Array.from(
        { length: BASE_HISTORY_YEARS + 1 },
        (_, i) => currentYear - i
    );

    const allowedYears =
        allowedHistoryYears === null
            ? baseYears
            : baseYears.filter(
                (year) => currentYear - year < allowedHistoryYears
            );

    /* ===============================
       FETCH ANALYTICS
    =============================== */

    const { data, isLoading } = useSWR(
        id
            ? `/api/analytics/landlord/revenue-expense-trend?property_id=${id}&year=${selectedYear}&landlord_id=${landlordId}`
            : null,
        fetcher
    );

    const metrics = data?.metrics || {};

    if (isLoading || loadingSubscription) {
        return <SkeletonLoader />;
    }

    if (subscription && !canUseFinancials) {
        return <UpgradeRequired router={router} />;
    }

    /* ===============================
       CHART CONFIG
    =============================== */

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                ticks: {
                    callback: (v: any) =>
                        "₱" + Number(v).toLocaleString(),
                },
            },
        },
    };

    const noiChart = {
        labels: metrics.monthNames ?? [],
        datasets: [
            {
                label: "NOI",
                data: metrics.noiTrend ?? [],
                borderColor: "#2563eb",
                backgroundColor:
                    "rgba(37, 99, 235, 0.12)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const grossChart = {
        labels: metrics.monthNames ?? [],
        datasets: [
            {
                label: "Gross Operating Income",
                data: metrics.grossRentTrend ?? [],
                borderColor: "#10b981",
                backgroundColor:
                    "rgba(16, 185, 129, 0.12)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    /* ===============================
       UI
    =============================== */

    return (
        <div className="pb-24 md:pb-6">
            <div className="px-4 md:px-6 pt-20 md:pt-6">

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            Financial Performance
                        </h1>
                        <p className="text-sm text-gray-600">
                            Net Operating Income & Revenue Analysis
                        </p>
                    </div>
                </div>

                {/* YEAR FILTER */}
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            const year = Number(e.target.value);

                            if (
                                allowedHistoryYears !== null &&
                                currentYear - year >=
                                allowedHistoryYears
                            ) {
                                Swal.fire(
                                    "Upgrade Required",
                                    "Your plan limits how far back you can view financial data.",
                                    "warning"
                                );
                                return;
                            }
                            setSelectedYear(year);
                        }}
                        className="px-3 py-1.5 text-sm border rounded-lg"
                    >
                        {allowedYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* GOI */}
                <Section
                    title="Gross Operating Income (GOI)"
                    icon={
                        <PlusCircle className="w-5 h-5 text-emerald-600" />
                    }
                >
                    <MetricGrid metrics={metrics.grossRent} />
                    <ChartToggle
                        title="GOI Monthly Trend"
                        open={showGrossChart}
                        toggle={() =>
                            setShowGrossChart(!showGrossChart)
                        }
                    >
                        <Line
                            data={grossChart}
                            options={chartOptions}
                        />
                    </ChartToggle>
                </Section>

                {/* NOI */}
                <Section
                    title="Net Operating Income (NOI)"
                    icon={
                        <DollarSign className="w-5 h-5 text-blue-600" />
                    }
                >
                    <MetricGrid metrics={metrics.noi} />
                    <ChartToggle
                        title="NOI Monthly Trend"
                        open={showNOIChart}
                        toggle={() =>
                            setShowNOIChart(!showNOIChart)
                        }
                    >
                        <Line
                            data={noiChart}
                            options={chartOptions}
                        />
                    </ChartToggle>
                </Section>
            </div>
        </div>
    );
}

/* ===============================
   REUSABLE COMPONENTS
============================== */

function Section({ title, icon, children }: any) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h2 className="text-lg font-bold">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function MetricGrid({ metrics }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {["mtm", "ytd", "yoy"].map((k) => (
                <MetricCard
                    key={k}
                    label={k.toUpperCase()}
                    current={metrics?.[k]?.current}
                    last={metrics?.[k]?.last}
                    variance={metrics?.[k]?.variance}
                />
            ))}
        </div>
    );
}

function MetricCard({
                        label,
                        current,
                        last,
                        variance,
                    }: any) {
    const positive = variance >= 0;

    return (
        <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">
                {label}
            </p>
            <p className="text-2xl font-bold">
                {formatCurrency(current)}
            </p>
            <p className="text-xs text-gray-400">
                Last: {formatCurrency(last)}
            </p>
            <div className="flex items-center gap-1 mt-2">
                {positive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                    className={`text-sm ${
                        positive
                            ? "text-emerald-600"
                            : "text-red-600"
                    }`}
                >
          {variance?.toFixed(2)}%
        </span>
            </div>
        </div>
    );
}

function ChartToggle({
                         title,
                         open,
                         toggle,
                         children,
                     }: any) {
    return (
        <div className="bg-white border rounded-lg">
            <button
                onClick={toggle}
                className="w-full p-4 flex justify-between items-center"
            >
        <span className="font-semibold">
          {title}
        </span>
                <ChevronDown
                    className={`transition ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>
            {open && (
                <div className="p-4 h-[320px]">
                    {children}
                </div>
            )}
        </div>
    );
}

/* ===============================
   FALLBACKS
============================== */

function SkeletonLoader() {
    return (
        <div className="h-[60vh] animate-pulse bg-gray-100 rounded-lg" />
    );
}

function UpgradeRequired({ router }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <button
                onClick={() =>
                    router.push(
                        "/pages/landlord/subsciption_plan/pricing"
                    )
                }
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
            >
                Upgrade to View Financials
            </button>
        </div>
    );
}
