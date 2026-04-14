"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DataTable } from "@/components/landlord/analytics/detailed/DataTable";
import { KPIStatCard } from "@/components/landlord/analytics/detailed/KPIStatCard";
import { PropertyFilter } from "@/components/landlord/analytics/detailed/PropertyFilter";
import UtilityTrendsChart from "@/components/landlord/analytics/utilityTrend";
import { BackButton } from "@/components/navigation/backButton";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function UtilityTrendsDetailContent() {
    const searchParams = useSearchParams();
    const landlord_id = searchParams.get("landlord_id");
    const [propertyId, setPropertyId] = useState("all");

    const [utilityTrend, setUtilityTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;
        setLoading(true);
        fetch(`/api/analytics/landlord/getMonthlyUtilityTrends?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                setUtilityTrend(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching utility trend:", error);
                setLoading(false);
            });
    }, [landlord_id]);

    // All months
    const months = [...new Set(utilityTrend.map((item) => item.month))];

    // Aggregate totals across all properties
    const waterData = months.map(
        (m) =>
            utilityTrend
                .filter((u) => u.month === m && u.utility_type === "water")
                .reduce((sum, row) => sum + row.total_expense, 0)
    );
    const electricityData = months.map(
        (m) =>
            utilityTrend
                .filter((u) => u.month === m && u.utility_type === "electricity")
                .reduce((sum, row) => sum + row.total_expense, 0)
    );

    const totalWater = waterData.reduce((a, b) => a + b, 0);
    const totalElectricity = electricityData.reduce((a, b) => a + b, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <BackButton label="Go Back" />
            <h1 className="text-2xl font-semibold">Utility Expense Trends</h1>
            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPIStatCard
                    title="Total Water Expense"
                    value={`₱${Number(totalWater).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <KPIStatCard
                    title="Total Electricity Expense"
                    value={`₱${Number(totalElectricity).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <KPIStatCard title="Highest Month" value={months[waterData.concat(electricityData).indexOf(Math.max(...waterData.concat(electricityData)))] || "-"} />
            </div>
            {landlord_id && (
                <PropertyFilter
                    landlordId={landlord_id}
                    onChange={(id) => setPropertyId(id)}
                />
            )}
            {/* Overall Trend Chart */}
            {landlord_id && (
                <UtilityTrendsChart landlordId={landlord_id} propertyId={propertyId} />
            )}

            {/* Breakdown Per Property */}
            <div className="space-y-4">
                {Array.from(new Set(utilityTrend.map((u) => u.property_name))).map((property) => {
                    const propertyData = utilityTrend.filter((u) => u.property_name === property);
                    const water = months.map(
                        (m) =>
                            propertyData.find((u) => u.month === m && u.utility_type === "water")?.total_expense || 0
                    );
                    const electricity = months.map(
                        (m) =>
                            propertyData.find((u) => u.month === m && u.utility_type === "electricity")?.total_expense || 0
                    );

                    return (
                        <div key={property} className="bg-white rounded-xl shadow-sm p-5">
                            <h2 className="text-lg font-medium mb-4">{property}</h2>
                            <Chart
                                options={{
                                    chart: { type: "bar", stacked: true },
                                    xaxis: { categories: months },
                                    title: { text: `Utility Expenses - ${property}`, align: "center" },
                                }}
                                series={[
                                    { name: "Water", data: water },
                                    { name: "Electricity", data: electricity },
                                ]}
                                type="bar"
                                height={300}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Raw Data Table */}
            <div className="bg-white rounded-xl shadow-sm p-5">
                <DataTable data={utilityTrend} />
            </div>
        </div>
    );
}

export default function UtilityTrendsDetailPage() {
    return (
        <Suspense fallback={<div className="p-6 text-gray-500">Loading analytics...</div>}>
            <UtilityTrendsDetailContent />
        </Suspense>
    );
}
