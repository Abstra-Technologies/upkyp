"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Droplets, Zap } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UtilityCostTrendChartProps {
    propertyId: string;
}

export default function UtilityCostTrendChart({ propertyId }: UtilityCostTrendChartProps) {
    const [waterData, setWaterData] = useState<any[]>([]);
    const [elecData, setElecData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWater, setShowWater] = useState(true);
    const [showElec, setShowElec] = useState(true);

    useEffect(() => {
        if (!propertyId) return;
        fetchData();
    }, [propertyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/landlord/properties/getConcessionaireHistory?property_id=${propertyId}`
            );
            const data = await res.json();

            const water = (data.waterBillings || [])
                .map((b: any) => ({
                    period: `${new Date(b.period_start).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "2-digit",
                    })}`,
                    cost: b.total_amount,
                    consumption: b.consumption,
                }))
                .reverse();

            const elec = (data.electricityBillings || [])
                .map((b: any) => ({
                    period: `${new Date(b.period_start).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "2-digit",
                    })}`,
                    cost: b.total_amount,
                    consumption: b.consumption,
                }))
                .reverse();

            setWaterData(water);
            setElecData(elec);
        } catch (err) {
            console.error("Failed to fetch utility cost trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set([...waterData.map((d) => d.period), ...elecData.map((d) => d.period)])];

    const waterCosts = categories.map(
        (cat) => waterData.find((d) => d.period === cat)?.cost ?? 0
    );
    const elecCosts = categories.map(
        (cat) => elecData.find((d) => d.period === cat)?.cost ?? 0
    );

    const series = [
        ...(showWater ? [{ name: "Water Cost", data: waterCosts }] : []),
        ...(showElec ? [{ name: "Electricity Cost", data: elecCosts }] : []),
    ];

    const chartOptions: any = {
        chart: {
            type: "line",
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        colors: ["#2563eb", "#d97706"],
        stroke: {
            width: [3, 3],
            curve: "smooth",
        },
        markers: {
            size: 5,
            hover: { size: 7 },
        },
        xaxis: {
            categories,
            labels: {
                style: { fontSize: "11px" },
            },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => `₱${val.toLocaleString()}`,
            },
        },
        grid: {
            borderColor: "#e5e7eb",
            strokeDashArray: 4,
        },
        legend: { show: false },
        tooltip: {
            y: {
                formatter: (val: number) => `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            },
        },
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48" />
                <div className="h-64 bg-gray-100 rounded" />
            </div>
        );
    }

    if (!waterData.length && !elecData.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No utility cost data available for charting.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                    Monthly Utility Cost Comparison
                </h3>
                <div className="flex items-center gap-3">
                    {waterData.length > 0 && (
                        <button
                            onClick={() => setShowWater(!showWater)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                                showWater
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-gray-100 text-gray-400 border border-gray-200"
                            }`}
                        >
                            <Droplets className="w-3 h-3" />
                            Water
                        </button>
                    )}
                    {elecData.length > 0 && (
                        <button
                            onClick={() => setShowElec(!showElec)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                                showElec
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-gray-100 text-gray-400 border border-gray-200"
                            }`}
                        >
                            <Zap className="w-3 h-3" />
                            Electricity
                        </button>
                    )}
                </div>
            </div>

            <Chart
                options={chartOptions}
                series={series}
                type="line"
                height={300}
            />
        </div>
    );
}
