"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Droplets, Zap, AlertCircle } from "lucide-react";

import dynamic from "next/dynamic";
import type { MRT_ColumnDef } from "material-react-table";

const MaterialReactTable = dynamic(
    () =>
        import("material-react-table").then((mod) => mod.MaterialReactTable),
    { ssr: false }
);

export default function ConcessionaireBillingHistory({
    propertyId,
}: {
    propertyId: number;
}) {
    const [waterBillings, setWaterBillings] = useState<any[]>([]);
    const [electricityBillings, setElectricityBillings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (!propertyId) return;
        fetchData();
    }, [propertyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/api/landlord/properties/getConcessionaireHistory?property_id=${propertyId}`
            );
            setWaterBillings(res.data.waterBillings || []);
            setElectricityBillings(res.data.electricityBillings || []);
        } catch {
            Swal.fire(
                "Error",
                "Failed to fetch concessionaire billing history.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const totals = useMemo(() => ({
        water: waterBillings.reduce(
            (sum, b) => sum + Number(b.consumption || 0),
            0
        ),
        electricity: electricityBillings.reduce(
            (sum, b) => sum + Number(b.consumption || 0),
            0
        ),
    }), [waterBillings, electricityBillings]);

    const waterColumns: MRT_ColumnDef<any>[] = [
        {
            accessorKey: "period_start",
            header: "Period",
            size: 180,
            Cell: ({ row }) => (
                <span className="truncate block">
                    {new Date(row.original.period_start).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(row.original.period_end).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            ),
        },
        { accessorKey: "consumption", header: "Consumption (m³)", size: 140 },
        { accessorKey: "rate", header: "Rate per m³", size: 120 },
        {
            accessorKey: "total_amount",
            header: "Total Amount",
            size: 140,
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
    ];

    const electricityColumns: MRT_ColumnDef<any>[] = [
        {
            accessorKey: "period_start",
            header: "Period",
            size: 180,
            Cell: ({ row }) => (
                <span className="truncate block">
                    {new Date(row.original.period_start).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(row.original.period_end).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            ),
        },
        { accessorKey: "consumption", header: "Consumption (kWh)", size: 150 },
        { accessorKey: "rate", header: "Rate per kWh", size: 130 },
        {
            accessorKey: "total_amount",
            header: "Total Amount",
            size: 140,
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
    ];

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                ))}
            </div>
        );
    }

    if (!waterBillings.length && !electricityBillings.length) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                <AlertCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">
                    No Utility Records Found
                </p>
                <p className="text-sm text-gray-500">
                    No concessionaire billing data available.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard
                    icon={<Droplets className="w-5 h-5 text-white" />}
                    title="Total Water Consumption"
                    value={`${totals.water.toFixed(2)} m³`}
                    color="bg-blue-600"
                />
                <SummaryCard
                    icon={<Zap className="w-5 h-5 text-white" />}
                    title="Total Electricity Consumption"
                    value={`${totals.electricity.toFixed(2)} kWh`}
                    color="bg-amber-600"
                />
            </div>

            {isMobile ? (
                <div className="space-y-6">
                    {waterBillings.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-blue-600" />
                                Water Billing History
                            </h3>
                            <div className="space-y-3">
                                {waterBillings.map((b) => (
                                    <div key={b.bill_id} className="border rounded-lg p-4">
                                        <div className="text-xs text-gray-500 mb-2">
                                            {new Date(b.period_start).toLocaleDateString("en-PH", {
                                                month: "short",
                                                year: "numeric",
                                            })}{" "}
                                            –{" "}
                                            {new Date(b.period_end).toLocaleDateString("en-PH", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <Row label="Consumption" value={`${b.consumption} m³`} />
                                        <Row label="Rate" value={formatCurrency(b.rate)} />
                                        <Row label="Total" value={formatCurrency(b.total_amount)} bold />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {electricityBillings.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-600" />
                                Electricity Billing History
                            </h3>
                            <div className="space-y-3">
                                {electricityBillings.map((b) => (
                                    <div key={b.bill_id} className="border rounded-lg p-4">
                                        <div className="text-xs text-gray-500 mb-2">
                                            {new Date(b.period_start).toLocaleDateString("en-PH", {
                                                month: "short",
                                                year: "numeric",
                                            })}{" "}
                                            –{" "}
                                            {new Date(b.period_end).toLocaleDateString("en-PH", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <Row label="Consumption" value={`${b.consumption} kWh`} />
                                        <Row label="Rate" value={formatCurrency(b.rate)} />
                                        <Row label="Total" value={formatCurrency(b.total_amount)} bold />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {waterBillings.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-blue-600" />
                                Water Billing History
                            </h3>
                            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                <MaterialReactTable
                                    layoutMode="grid"
                                    columns={waterColumns}
                                    data={waterBillings}
                                    enableTopToolbar={false}
                                    enableColumnActions={false}
                                    enableColumnFilters={false}
                                    enableSorting
                                    initialState={{
                                        pagination: { pageIndex: 0, pageSize: 10 },
                                    }}
                                    muiTableContainerProps={{
                                        sx: { maxWidth: "100%", overflowX: "hidden" },
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {electricityBillings.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-600" />
                                Electricity Billing History
                            </h3>
                            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                <MaterialReactTable
                                    layoutMode="grid"
                                    columns={electricityColumns}
                                    data={electricityBillings}
                                    enableTopToolbar={false}
                                    enableColumnActions={false}
                                    enableColumnFilters={false}
                                    enableSorting
                                    initialState={{
                                        pagination: { pageIndex: 0, pageSize: 10 },
                                    }}
                                    muiTableContainerProps={{
                                        sx: { maxWidth: "100%", overflowX: "hidden" },
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    icon,
    title,
    value,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
}) {
    return (
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-600">{title}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </div>
    );
}

function Row({
    label,
    value,
    bold,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{label}</span>
            <span className={bold ? "font-semibold" : ""}>{value}</span>
        </div>
    );
}
