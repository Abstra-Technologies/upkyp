"use client";

import React from "react";
import { useTenantBilling } from "@/hooks/tenant/useTenantBilling";
import { computeLateFee } from "@/utils/tenants/billing/computeLateFee";
import { calculateTotals } from "@/utils/tenants/billing/calculateTotals";
import { getBillingDueDate } from "@/utils/tenants/billing/formatDueDate";
import { formatDate } from "@/utils/formatter/formatters";

import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

import RentBreakdown from "./RentBreakdown";
import UtilityBreakdown from "./UtilityBreakdown";
import PDCSection from "./PDCSection";
import PaymentSection from "./PaymentSection";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
function StatusBadge({
                         status,
                     }: {
    status: "paid" | "unpaid" | "overdue" | "draft" | "finalized";
}) {
    const map: Record<
        typeof status,
        { label: string; cls: string }
    > = {
        paid: {
            label: "Paid",
            cls: "bg-green-100 text-green-700 border-green-200",
        },
        unpaid: {
            label: "Unpaid",
            cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
        },
        overdue: {
            label: "Overdue",
            cls: "bg-red-100 text-red-700 border-red-200",
        },
        draft: {
            label: "Draft",
            cls: "bg-gray-100 text-gray-700 border-gray-200",
        },
        finalized: {
            label: "Finalized",
            cls: "bg-blue-100 text-blue-700 border-blue-200",
        },
    };

    const cfg = map[status] ?? map.unpaid;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.cls}`}
        >
      {cfg.label}
    </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export default function TenantBilling({
                                          agreement_id,
                                          user_id,
                                      }: {
    agreement_id?: string;
    user_id?: string;
}) {
    const {
        billingData,
        setBillingData,
        meterReadings,
        loading,
        error,
    } = useTenantBilling(agreement_id, user_id);

    if (loading) return <LoadingScreen />;

    if (error)
        return (
            <ErrorBoundary error={error} onRetry={() => location.reload()} />
        );

    if (!billingData?.length)
        return (
            <div className="text-center py-10">
                <h2 className="text-base font-bold text-gray-700">
                    No Billing Available
                </h2>
                <p className="text-sm text-gray-500">
                    Billing will appear once generated.
                </p>
            </div>
        );

    return (
        <div className="space-y-3">
            {billingData.map((bill: any) => {
                const { lateFee } = computeLateFee(bill);
                const totals = calculateTotals(bill, lateFee);
                const dueDate = getBillingDueDate(bill);

                const billingStatus =
                    bill.billing_status ?? bill.status ?? "unpaid";

                const billDate = new Date(bill.billing_period);
                const billMonth = billDate.getMonth();
                const billYear = billDate.getFullYear();

                const scopedMeterReadings = (meterReadings || []).filter(
                    (r: any) => {
                        if (!r?.reading_date) return false;
                        const d = new Date(r.reading_date);
                        return (
                            d.getMonth() === billMonth &&
                            d.getFullYear() === billYear
                        );
                    }
                );

                return (
                    <div
                        key={bill.billing_id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b bg-gray-50">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-center">
                                <div>
                                    <p className="text-[10px] text-gray-500">Billing Period</p>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {formatDate(bill.billing_period)}
                                    </p>
                                </div>

                                <div className="text-right md:text-left">
                                    <p className="text-[10px] text-gray-500">Due Date</p>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {formatDate(dueDate)}
                                    </p>
                                </div>

                                <div className="col-span-2 md:col-span-1 md:text-right">
                                    <p className="text-[10px] text-gray-500 mb-1">
                                        Payment Status
                                    </p>
                                    <StatusBadge status={billingStatus} />
                                </div>
                            </div>
                        </div>

                        <div className="px-3 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Total Amount Due
              </span>
                            <span className="text-base md:text-lg font-bold text-emerald-600">
                ₱{totals.totalDue.toFixed(2)}
              </span>
                        </div>

                        <div className="px-3 pb-3 space-y-3">
                            <RentBreakdown
                                bill={bill}
                                totals={totals}
                                lateFee={lateFee}
                                setBillingData={setBillingData}
                            />

                            <UtilityBreakdown
                                bill={bill}
                                totals={totals}
                                meterReadings={scopedMeterReadings}
                                setBillingData={setBillingData}
                            />

                            {bill.postDatedChecks?.length > 0 && (
                                <PDCSection pdcs={bill.postDatedChecks} />
                            )}
                        </div>

                        <div className="px-3 py-2 border-t bg-gray-50">
                            <PaymentSection
                                bill={bill}
                                totalDue={totals.totalDue}
                                agreement_id={agreement_id}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
