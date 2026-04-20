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

    if (loading) return null;

    const pendingBillings = billings.filter(
        (b) => b.status !== "paid"
    );

    if (pendingBillings.length === 0) {
        return (
            <div className="text-center text-gray-500 text-sm py-4">
                No pending payments due
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {pendingBillings.map((billing) => {
                const isOverdue = billing.status === "overdue";

                return (
                    <div
                        key={billing.billing_id}
                        className={`rounded-xl p-3 border ${
                            isOverdue
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-red-100">
                                {isOverdue ? (
                                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                                ) : (
                                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold ${
                                    isOverdue ? "text-red-900" : "text-orange-900"
                                }`}>
                                    {isOverdue ? "Overdue" : "Pending"}
                                </p>

                                {isOverdue && billing.billing_period && (
                                    <p className="text-[10px] text-red-600">
                                        {new Date(billing.billing_period).toLocaleDateString(
                                            "en-US",
                                            { month: "short", year: "numeric" }
                                        )}
                                        {" · "}{billing.days_late}d late
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <p className={`text-sm font-bold ${
                                    isOverdue ? "text-red-700" : "text-orange-700"
                                }`}>
                                    ₱{billing.total_due.toLocaleString()}
                                </p>
                            </div>
                        </div>

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
                    </div>
                );
            })}
        </div>
    );
}
