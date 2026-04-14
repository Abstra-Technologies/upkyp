

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BackButton } from "@/components/navigation/backButton";
import { KPIStatCard } from "@/components/landlord/analytics/detailed/KPIStatCard";
import { PropertyFilter } from "@/components/landlord/analytics/detailed/PropertyFilter";
import useAuthStore from "@/zustand/authStore";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RevenueDetailContent() {
    const { user } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [propertyId, setPropertyId] = useState("all");
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        setLoading(true);
        fetch(
            `/api/analytics/landlord/getMonthlyRevenue?landlord_id=${landlord_id}`
        )
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRevenueData(data);
                else setRevenueData([]);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching revenue data:", err);
                setRevenueData([]);
                setLoading(false);
            });
    }, [landlord_id]);

    // Filter by selected property
    const filteredData =
        propertyId === "all"
            ? revenueData
            : revenueData.filter((r) => r.property_id?.toString() === propertyId);

    // Extract months
    const months = [...new Set(filteredData.map((r) => r.month))];

    // Monthly totals for chart
    const monthlyTotals = months.map((m) =>
        filteredData
            .filter((r) => r.month === m)
            .reduce((sum, row) => sum + row.total_revenue, 0)
    );

    // KPIs
    const totalRevenue = monthlyTotals.reduce((a, b) => a + b, 0);
    const highestMonthIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));

    // MRT columns
    const columns: MRT_ColumnDef<any>[] = [
        { accessorKey: "month", header: "Month" },
        { accessorKey: "property_name", header: "Property" },
        {
            accessorKey: "total_revenue",
            header: "Revenue",
            Cell: ({ cell }) =>
                `₱${Number(cell.getValue() as number).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <BackButton label="Go Back to Dashboard" />
            <h1 className="gradient-header">Revenue Performance</h1>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPIStatCard
                    title="Total Revenue"
                    value={`₱${Number(totalRevenue || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <KPIStatCard
                    title="Average Monthly Revenue"
                    value={`₱${Number(
                        months.length > 0 ? totalRevenue / months.length : 0
                    ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <KPIStatCard
                    title="Best Month"
                    value={months[highestMonthIdx] || "-"}
                />
            </div>

            {/* Property Filter */}
            {landlord_id && (
                <PropertyFilter landlordId={landlord_id} onChange={(id) => setPropertyId(id)} />
            )}

            {/* Overall Revenue Trend */}
            {months.length > 0 && monthlyTotals.some((val) => val > 0) ? (
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <Chart
                        options={{
                            chart: { type: "line" },
                            xaxis: { categories: months },
                            title: {
                                text:
                                    propertyId === "all"
                                        ? "Monthly Revenue Trend (All Properties)"
                                        : "Monthly Revenue Trend (Selected Property)",
                                align: "center",
                            },
                            yaxis: {
                                labels: { formatter: (val) => `₱${val.toLocaleString()}` },
                            },
                            noData: { text: "No revenue data available" }, // fallback if series empty
                        }}
                        series={[{ name: "Revenue", data: monthlyTotals }]}
                        type="line"
                        height={300}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                    <p className="text-lg font-medium">No revenue data yet</p>
                    <p className="text-sm">Revenue will appear here once payments are recorded.</p>
                </div>
            )}


            {/* Raw Data Table */}
            <div className="bg-white rounded-xl shadow-sm p-5">
                <MaterialReactTable
                    columns={columns}
                    data={filteredData}
                    state={{ isLoading: loading }}
                    enableColumnOrdering
                    muiTablePaperProps={{
                        elevation: 0,
                        sx: { borderRadius: "12px" },
                    }}
                />
            </div>
        </div>
    );
}
