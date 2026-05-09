"use client";

import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { CheckCircle2, Clock, AlertCircle, Receipt, CreditCard, Building2 } from "lucide-react";

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

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    confirmed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2, label: "Confirmed" },
    pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock, label: "Pending" },
    failed: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: AlertCircle, label: "Failed" },
};

const typeIcon: Record<string, typeof Receipt> = {
    rent: Receipt,
    deposit: CreditCard,
    utility: Building2,
};

export default function PropertyPaymentsStackedList({
    payments,
    loading,
}: {
    payments: Payment[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div>
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                                    <div className="h-3 w-16 bg-gray-200 rounded" />
                                </div>
                            </div>
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-900">No payments found</p>
                <p className="text-sm text-gray-500 mt-1">Payments will appear here once tenants start paying</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {payments.map((p) => {
                const status = statusConfig[p.payment_status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const TypeIcon = typeIcon[p.payment_type?.toLowerCase()] || Receipt;

                const date = new Date(p.payment_date);
                const monthYear = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
                const day = date.getDate();

                return (
                    <div
                        key={p.payment_id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        {/* Status bar on left */}
                        <div className="flex">
                            <div className={`w-1 shrink-0 ${
                                p.payment_status === "confirmed" ? "bg-emerald-500" :
                                p.payment_status === "failed" ? "bg-red-500" : "bg-amber-500"
                            }`} />

                            <div className="flex-1 p-4">
                                {/* Top row: Tenant + Status */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                            p.payment_status === "confirmed" ? "bg-emerald-100" :
                                            p.payment_status === "failed" ? "bg-red-100" : "bg-amber-100"
                                        }`}>
                                            <StatusIcon className={`w-5 h-5 ${status.text}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {p.tenant_name}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                <p className="text-xs text-gray-500">Unit {p.unit_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Amount row */}
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <TypeIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 capitalize">
                                            {p.payment_type.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(p.amount_paid)}
                                    </p>
                                </div>

                                {/* Details row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-medium">Date</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-base font-bold text-gray-900">{day}</span>
                                            <span className="text-xs text-gray-500">{monthYear}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-medium">Method</p>
                                        <p className="text-xs font-medium text-gray-700 mt-0.5 uppercase">
                                            {p.payment_method_id || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-medium">Reference</p>
                                        <p className="text-xs font-mono text-gray-700 mt-0.5 truncate">
                                            {p.receipt_reference || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
