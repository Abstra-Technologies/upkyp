"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    ExclamationTriangleIcon,
    CreditCardIcon,
    ClockIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface BillingSummary {
    billing_id: string;
    total_due: number;
    days_late: number;
    status: "paid" | "unpaid" | "overdue";
    billing_period?: string;
    due_date?: string;
}

interface PaymentDueWidgetProps {
    agreement_id: string;
}

export default function PaymentDueWidget({ agreement_id }: PaymentDueWidgetProps) {
    const [billings, setBillings] = useState<BillingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!agreement_id) {
            setLoading(false);
            return;
        }

        let active = true;

        async function fetchBilling() {
            try {
                const res = await axios.get(
                    "/api/tenant/dashboard/getPaymentDue",
                    { params: { agreement_id } }
                );

                if (active) {
                    const data = res.data.billing;
                    setBillings(Array.isArray(data) ? data : data ? [data] : []);
                }
            } catch {
                console.error("Failed to fetch payment due");
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchBilling();
        return () => {
            active = false;
        };
    }, [agreement_id]);

    if (loading) return null;

    if (billings.length === 0) {
        return (
            <div className="p-4 rounded-xl border bg-gray-50 text-center">
                <p className="text-sm font-medium text-gray-600">
                    No payment due
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    You’re all caught up 🎉
                </p>
            </div>
        );
    }

    const formatBillingMonth = (billing: BillingSummary) => {
        const raw =
            billing.billing_period ||
            billing.due_date;

        if (!raw) return null;

        return new Date(raw).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    const colorMap = {
        paid: {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            text: "text-emerald-900",
            subText: "text-emerald-700",
        },
        unpaid: {
            bg: "bg-orange-50",
            border: "border-orange-200",
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
            text: "text-orange-900",
            subText: "text-orange-700",
        },
        overdue: {
            bg: "bg-red-50",
            border: "border-red-200",
            iconBg: "bg-red-100",
            iconText: "text-red-600",
            text: "text-red-900",
            subText: "text-red-700",
        },
    };

    return (
        <div className="space-y-3">
            {billings.map((billing) => {
                const c = colorMap[billing.status];
                const showPayButton = billing.status !== "paid";
                const showDaysLate = billing.status === "overdue";
                const billingMonth =
                    billing.status === "overdue"
                        ? formatBillingMonth(billing)
                        : null;

                return (
                    <div
                        key={billing.billing_id}
                        className={`rounded-2xl p-5 shadow-sm border ${c.bg} ${c.border}`}
                    >
                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                                {billing.status === "paid" ? (
                                    <CheckCircleIcon className={`w-6 h-6 ${c.iconText}`} />
                                ) : (
                                    <ExclamationTriangleIcon className={`w-6 h-6 ${c.iconText}`} />
                                )}
                            </div>

                            <div className="flex-1">
                                <p className={`text-sm font-bold ${c.text}`}>
                                    {billing.status === "paid"
                                        ? "Payment Completed"
                                        : billing.status === "overdue"
                                            ? "Overdue Payment"
                                            : "Pending Payment"}
                                </p>

                                <p className={`text-xs mt-0.5 ${c.subText}`}>
                                    {billing.status === "paid"
                                        ? "Settled successfully"
                                        : billing.status === "overdue"
                                            ? "Past due date"
                                            : "Within grace period"}
                                </p>

                                {/* 🔴 OVERDUE MONTH */}
                                {billingMonth && (
                                    <p className="mt-1 text-xs font-semibold text-red-700">
                                        Billing Period: {billingMonth}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Amount + Days Late */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white border rounded-xl p-3">
                                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                                    Amount Due
                                </p>
                                <p className={`text-xl font-extrabold ${c.iconText}`}>
                                    ₱{billing.total_due.toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-white border rounded-xl p-3">
                                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                                    Days Late
                                </p>
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4 text-gray-500" />
                                    <p className={`text-xl font-extrabold ${c.iconText}`}>
                                        {showDaysLate ? billing.days_late : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pay Button */}
                        {showPayButton && (
                            <button
                                onClick={() =>
                                    router.push(
                                        `/tenant/rentalPortal/${agreement_id}/billing?billing_id=${billing.billing_id}`
                                    )
                                }
                                className={`
                  mt-4 w-full flex items-center justify-center gap-2
                  text-white font-semibold text-sm
                  py-3 rounded-xl transition
                  ${
                                    billing.status === "overdue"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                }
                `}
                            >
                                <CreditCardIcon className="w-5 h-5" />
                                Pay Now
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
