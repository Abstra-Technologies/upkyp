"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    CalendarIcon,
    ClockIcon,
    CreditCardIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface Props {
    agreement_id: string;
}

export default function LeaseInfoCombined({ agreement_id }: Props) {
    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLease() {
            try {
                const res = await axios.get(
                    "/api/tenant/activeRent/leaseAgreement/signatureStatus",
                    { params: { agreement_id } }
                );
                setLease(res.data);
            } catch (err) {
                console.error("Failed to load lease:", err);
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) loadLease();
    }, [agreement_id]);

    if (loading) {
        return <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />;
    }

    if (!lease) return null;

    const signature = lease.tenant_signature ?? null;
    const isSigned = signature?.status === "signed";
    const needsSigning = signature && !isSigned;

    const leaseData = lease.lease || {};

    const startDate = leaseData.start_date;
    const endDate = leaseData.end_date;
    const hasEndDate = endDate && endDate !== "0000-00-00";

    let daysRemaining = null;
    let progressPercent = 0;
    let leaseStatus = "Active";

    if (hasEndDate && startDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
        const elapsed = Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
        daysRemaining = Math.max(Math.ceil(totalDays - elapsed), 0);
        progressPercent = Math.min((elapsed / totalDays) * 100, 100);

        if (daysRemaining <= 0) leaseStatus = "Expired";
        else if (daysRemaining <= 30) leaseStatus = "Expiring Soon";
    } else if (!hasEndDate) {
        leaseStatus = "Open";
    }

    const statusColor = leaseStatus === "Expired"
        ? "text-red-600 bg-red-50"
        : leaseStatus === "Expiring Soon"
            ? "text-amber-600 bg-amber-50"
            : "text-emerald-600 bg-emerald-50";

    return (
        <div className="space-y-3">
            {/* Header with status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Lease Period</p>
                        <p className="text-xs text-gray-500">{leaseStatus}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                    {leaseStatus}
                </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-[10px] text-blue-700 font-medium uppercase">Start</p>
                    <p className="text-xs font-bold">{startDate ? formatDate(startDate) : "-"}</p>
                </div>
                <div className={`rounded-lg border p-2 ${statusColor}`}>
                    <p className={`text-[10px] font-medium uppercase`}>End</p>
                    <p className="text-xs font-bold">{hasEndDate ? formatDate(endDate) : "Open"}</p>
                </div>
            </div>

            {/* Time remaining bar */}
            {daysRemaining !== null && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{daysRemaining} days left</span>
                        <span className="font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                        <div
                            className={`h-1.5 rounded-full ${
                                leaseStatus === "Expired" ? "bg-red-500" :
                                leaseStatus === "Expiring Soon" ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Financial info */}
            <div className="border-t border-gray-100 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <CreditCardIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-gray-600">Monthly Rent</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(leaseData.rent_amount || 0)}
                    </span>
                </div>
            </div>

            {/* Signature status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {isSigned ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    ) : needsSigning ? (
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                        <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600">
                        {isSigned ? "Signed" : needsSigning ? "Signature Required" : "No signature"}
                    </span>
                </div>
                {isSigned && (
                    <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                )}
            </div>
        </div>
    );
}