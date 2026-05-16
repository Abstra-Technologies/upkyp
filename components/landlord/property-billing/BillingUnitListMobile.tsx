"use client";

import { useState, useEffect } from "react";
import { User2, Calendar, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, MoreHorizontal, Eye } from "lucide-react";

const statusConfig: Record<string, { dot: string; badge: string; icon: any; label: string }> = {
    paid: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Paid" },
    partial: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Partial" },
    draft: { dot: "bg-gray-400", badge: "bg-gray-50 text-gray-700 border-gray-200", icon: FileText, label: "Draft" },
    no_bill: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText, label: "No Bill" },
    overdue: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, label: "Overdue" },
    unpaid: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Unpaid" },
};

const formatShort = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

export default function BillingUnitListMobile({
    bills,
    propertyDetails,
    router,
    property_id,
    guardActionWithConfig,
    isCreateBillAllowed,
    onViewBill,
}: any) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const toggleMenu = (e: React.MouseEvent, billId: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === billId ? null : billId);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openMenuId && !(e.target as HTMLElement).closest('.billing-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [openMenuId]);

    if (!bills.length) return null;

    return (
        <div id="units-list-section-mobile" className="block md:hidden space-y-2 mb-4 -mx-2">
            {bills.map((bill: any) => {
                const status = statusConfig[bill.billing_status as keyof typeof statusConfig] || statusConfig.unpaid;
                const StatusIcon = status.icon;
                const billId = bill.bill_id || bill.id || bill.lease_id;

                return (
                    <div
                        key={billId}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible active:scale-[0.99] transition-transform"
                    >
                        <div className="flex items-stretch">
                            <div
                                className="flex-1 px-3 py-2.5 flex items-center gap-2.5 min-w-0 cursor-pointer"
                                onClick={() => onViewBill?.(bill)}
                            >
                                <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${status.dot}`} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-gray-900 truncate">{bill.unit_name}</p>
                                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                                    </div>

                                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                        <User2 className="w-3 h-3" />
                                        {bill.tenant_name || "No tenant"}
                                    </p>

                                    <div className="mt-1.5 space-y-0.5">
                                        {Number(bill.previous_balance || 0) > 0 && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-gray-400">Prev. Balance</span>
                                                <span className="font-semibold text-red-600">
                                                    ₱{Number(bill.previous_balance).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400">Total Due</span>
                                            <span className="font-bold text-gray-900">
                                                ₱{Number(bill.total_amount_due || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-between px-2 py-2.5 gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${status.badge}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    {bill.billing_status === "no_bill" && isCreateBillAllowed ? (
                                        <button
                                            onClick={() =>
                                                guardActionWithConfig(() =>
                                                    router.push(
                                                        `/landlord/properties/${property_id}/billing/createUnitBill/${bill.agreement_id || bill.lease_id}`,
                                                    ),
                                                )
                                            }
                                            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                                        >
                                            Create Bill
                                        </button>
                                    ) : bill.billing_status !== "no_bill" ? (
                                        <div className="relative billing-menu-container">
                                            <button
                                                onClick={(e) => toggleMenu(e, billId)}
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            {openMenuId === billId && (
                                                <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                                                    <button
                                                        onClick={() => {
                                                            onViewBill?.(bill);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View Bill
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">—</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
