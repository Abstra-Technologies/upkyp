"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { MaterialReactTable,  MRT_ColumnDef } from "material-react-table";

import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import useAuthStore from "@/zustand/authStore";
import { ReceiptText } from "lucide-react";

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
       DESKTOP TABLE COLUMNS
    ========================= */
    const columns = useMemo<MRT_ColumnDef<Payment>[]>(
        () => [
            { accessorKey: "tenant_name", header: "Tenant" },
            { accessorKey: "unit_name", header: "Unit" },
            {
                accessorKey: "payment_type",
                header: "Type",
                Cell: ({ cell }) =>
                    cell.getValue<string>().replace("_", " "),
            },
            {
                accessorKey: "amount_paid",
                header: "Amount",
                Cell: ({ cell }) =>
                    formatCurrency(cell.getValue<number>()),
            },
            {
                accessorKey: "payment_method_id",
                header: "Method",
                Cell: ({ cell }) => (
                    <Typography
                        variant="caption"
                        sx={{ textTransform: "uppercase" }}
                    >
                        {cell.getValue<string>()}
                    </Typography>
                ),
            },
            {
                accessorKey: "payment_status",
                header: "Status",
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
            {
                accessorKey: "payment_date",
                header: "Paid At",
                Cell: ({ cell }) =>
                    formatDate(cell.getValue<string>()),
            },
        ],
        []
    );

    /* =========================
       UI
    ========================= */
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Property Payments</h1>
                    <p className="text-sm text-gray-600">
                        Complete payment history
                    </p>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* =========================
         MOBILE — STACKED LIST
      ========================= */}
            <div className="block md:hidden">
                <PropertyPaymentsStackedList
                    payments={payments}
                    loading={loading}
                />
            </div>

            {/* =========================
         DESKTOP — MATERIAL TABLE
      ========================= */}
            <div className="hidden md:block">
                <MaterialReactTable
                    columns={columns}
                    data={payments}
                    state={{ isLoading: loading }}
                    enableGlobalFilter
                    enableColumnFilters
                    enableSorting
                    enablePagination
                    enableRowVirtualization
                    rowVirtualizerProps={{ overscan: 10 }}
                    initialState={{
                        pagination: { pageSize: 10, pageIndex: 0 },
                        density: "comfortable",
                    }}
                    muiTablePaperProps={{
                        elevation: 0,
                        sx: {
                            borderRadius: 3,
                            border: "1px solid #e5e7eb",
                        },
                    }}
                    muiSearchTextFieldProps={{
                        placeholder: "Search tenant, unit, or type…",
                        variant: "outlined",
                        size: "small",
                    }}
                />
            </div>
        </div>
    );
}
