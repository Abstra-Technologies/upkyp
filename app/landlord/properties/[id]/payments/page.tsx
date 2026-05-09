"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import useAuthStore from "@/zustand/authStore";
import { ReceiptText, TrendingUp, AlertCircle, CheckCircle2, Clock, Filter, X } from "lucide-react";
import { Chip, Typography } from "@mui/material";
import PropertyPaymentsStackedList from "@/components/landlord/properties/PropertyPaymentsStackedList";

/* =========================
   TYPES
========================= */
interface Payment {
    payment_id: number;
    tenant_name: string;
    unit_name: string;
    payment_type: string;
    amount_paid: number;
    payment_method_id: string;
    payment_status: string;
    payment_date: string;
    payout_status: string;
    receipt_reference: string;
}

/* =========================
   PAGE
========================= */
export default function PropertyPaymentsPage() {
    const { id } = useParams();
    const property_id = id as string;

    const { user, fetchSession } = useAuthStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    /* =========================
       AUTH
    ========================= */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* =========================
       FETCH PAYMENTS
    ========================= */
    useEffect(() => {
        if (!property_id || !user?.landlord_id) return;

        const fetchPayments = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await axios.get(
                    "/api/landlord/payments/getPerProperty",
                    {
                        params: {
                            property_id,
                            landlord_id: user.landlord_id,
                        },
                    }
                );

                setPayments(res.data.payments || []);
            } catch {
                setError("Failed to load property payments.");
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [property_id, user?.landlord_id]);

    /* =========================
       FILTERED PAYMENTS
    ========================= */
    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            const matchesStatus = statusFilter === "all" || p.payment_status === statusFilter;
            const matchesType = typeFilter === "all" || p.payment_type === typeFilter;
            const matchesSearch =
                !searchQuery ||
                p.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.receipt_reference?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesType && matchesSearch;
        });
    }, [payments, statusFilter, typeFilter, searchQuery]);

    /* =========================
       SUMMARY STATS
    ========================= */
    const stats = useMemo(() => {
        const confirmed = payments.filter((p) => p.payment_status === "confirmed");
        const pending = payments.filter((p) => p.payment_status === "pending");
        const failed = payments.filter((p) => p.payment_status === "failed");

        const totalCollected = confirmed.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        const totalPending = pending.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

        const byType: Record<string, number> = {};
        confirmed.forEach((p) => {
            const type = p.payment_type.replace("_", " ");
            byType[type] = (byType[type] || 0) + Number(p.amount_paid || 0);
        });

        const uniquePaymentTypes = [...new Set(payments.map((p) => p.payment_type))];

        return {
            totalCollected,
            totalPending,
            confirmedCount: confirmed.length,
            pendingCount: pending.length,
            failedCount: failed.length,
            totalCount: payments.length,
            byType,
            uniquePaymentTypes,
        };
    }, [payments]);

    /* =========================
       DESKTOP TABLE COLUMNS
    ========================= */
    const columns = useMemo<MRT_ColumnDef<Payment>[]>(
        () => [
            {
                accessorKey: "payment_date",
                header: "Date",
                size: 120,
                Cell: ({ cell }) => formatDate(cell.getValue<string>()),
            },
            { accessorKey: "tenant_name", header: "Tenant", size: 180 },
            { accessorKey: "unit_name", header: "Unit", size: 100 },
            {
                accessorKey: "payment_type",
                header: "Type",
                size: 140,
                Cell: ({ cell }) => (
                    <span className="capitalize">{cell.getValue<string>().replace("_", " ")}</span>
                ),
            },
            {
                accessorKey: "amount_paid",
                header: "Amount",
                size: 140,
                Cell: ({ cell }) => (
                    <span className="font-semibold">{formatCurrency(cell.getValue<number>())}</span>
                ),
            },
            {
                accessorKey: "payment_method_id",
                header: "Method",
                size: 120,
                Cell: ({ cell }) => (
                    <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                        {cell.getValue<string>()}
                    </Typography>
                ),
            },
            {
                accessorKey: "receipt_reference",
                header: "Reference",
                size: 140,
                Cell: ({ cell }) => (
                    <span className="font-mono text-xs">{cell.getValue<string>() || "—"}</span>
                ),
            },
            {
                accessorKey: "payment_status",
                header: "Status",
                size: 120,
                Cell: ({ cell }) => {
                    const status = cell.getValue<string>();
                    return (
                        <Chip
                            size="small"
                            label={status}
                            color={
                                status === "confirmed"
                                    ? "success"
                                    : status === "failed"
                                    ? "error"
                                    : "warning"
                            }
                        />
                    );
                },
                filterVariant: "select",
                filterSelectOptions: ["confirmed", "pending", "failed"],
            },
        ],
        []
    );

    const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || searchQuery;

    /* =========================
       UI
    ========================= */
    return (
        <div className="min-h-screen w-full max-w-none bg-gray-50 pb-24 md:pb-6">
            <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                            <ReceiptText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Payment Ledger</h1>
                            <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                Track all payments collected for this property
                            </p>
                        </div>
                    </div>

                    {/* ================= SUMMARY CARDS ================= */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-medium text-gray-500">Total Collected</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.totalCollected)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{stats.confirmedCount} payment(s)</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-medium text-gray-500">Pending</span>
                            </div>
                            <p className="text-lg font-bold text-amber-700">{formatCurrency(stats.totalPending)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{stats.pendingCount} payment(s)</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-xs font-medium text-gray-500">Failed</span>
                            </div>
                            <p className="text-lg font-bold text-red-700">{stats.failedCount}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">payment(s)</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-gray-500">Total Records</span>
                            </div>
                            <p className="text-lg font-bold text-blue-700">{stats.totalCount}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">all time</p>
                        </div>
                    </div>

                    {/* ================= BREAKDOWN BY TYPE ================= */}
                    {Object.keys(stats.byType).length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Revenue by Type</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.byType).map(([type, amount]) => (
                                    <div key={type} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-600 capitalize">{type}</span>
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ================= FILTERS ================= */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Filters</span>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setStatusFilter("all");
                                        setTypeFilter("all");
                                        setSearchQuery("");
                                    }}
                                    className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                >
                                    <X className="w-3 h-3" />
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tenant, unit, reference…"
                                className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                {stats.uniquePaymentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ================= ERROR ================= */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {/* ================= MOBILE — STACKED LIST ================= */}
                <div className="block md:hidden">
                    <PropertyPaymentsStackedList
                        payments={filteredPayments}
                        loading={loading}
                    />
                </div>

                {/* ================= DESKTOP — MATERIAL TABLE ================= */}
                <div className="hidden md:block">
                    <MaterialReactTable
                        columns={columns}
                        data={filteredPayments}
                        state={{ isLoading: loading }}
                        enableGlobalFilter={false}
                        enableColumnFilters
                        enableSorting
                        enablePagination
                        enableRowVirtualization
                        muiTableContainerProps={{
                            sx: { maxHeight: "600px" },
                        }}
                        initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                            density: "comfortable",
                            sorting: [{ id: "payment_date", desc: true }],
                        }}
                        muiTablePaperProps={{
                            elevation: 0,
                            sx: {
                                borderRadius: 3,
                                border: "1px solid #e5e7eb",
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
