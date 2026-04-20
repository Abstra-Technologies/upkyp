"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    ExclamationTriangleIcon,
    CreditCardIcon,
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

export default function MobilePaymentWidget({ agreement_id }: { agreement_id: string }) {
    const [billings, setBillings] = useState<BillingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!agreement_id) { setLoading(false); return; }
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
        return () => { active = false; };
    }, [agreement_id]);

    if (loading || billings.length === 0) return null;

    return (
        <div className="space-y-2">
            {billings.map((billing) => {
                const isPaid = billing.status === "paid";
                const isOverdue = billing.status === "overdue";

                return (
                    <div
                        key={billing.billing_id}
                        className={`rounded-xl p-3 border ${
                            isPaid
                                ? "bg-emerald-50 border-emerald-200"
                                : isOverdue
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${
                                isPaid ? "bg-emerald-100" : "bg-red-100"
                            }`}>
                                {isPaid ? (
                                    <CheckCircleIcon className={`w-4 h-4 ${isPaid ? "text-emerald-600" : "text-red-600"}`} />
                                ) : (
                                    <ExclamationTriangleIcon className={`w-4 h-4 ${isOverdue ? "text-red-600" : "text-orange-600"}`} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold ${
                                    isPaid ? "text-emerald-900" : isOverdue ? "text-red-900" : "text-orange-900"
                                }`}>
                                    {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                                </p>
                                {isOverdue && billing.billing_period && (
                                    <p className="text-[10px] text-red-600">
                                        {new Date(billing.billing_period).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                        {" · "}{billing.days_late}d late
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <p className={`text-sm font-bold ${
                                    isPaid ? "text-emerald-700" : isOverdue ? "text-red-700" : "text-orange-700"
                                }`}>
                                    ₱{billing.total_due.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {!isPaid && (
                            <button
                                onClick={() =>
                                    router.push(
                                        `/tenant/rentalPortal/${agreement_id}/billing?billing_id=${billing.billing_id}`
                                    )
                                }
                                className={`mt-2.5 w-full flex items-center justify-center gap-1.5 text-white font-semibold text-xs py-2 rounded-lg transition ${
                                    isOverdue
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                }`}
                            >
                                <CreditCardIcon className="w-3.5 h-3.5" />
                                Pay Now
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
