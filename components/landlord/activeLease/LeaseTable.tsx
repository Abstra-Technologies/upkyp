"use client";

import { Building2, QrCode, ArrowRight, Calendar, FileSignature, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

const requiresLandlordSignature = (lease: any) => {
    const status = getStatus(lease);
    return status === "pending_signature" || status === "landlord_pending_signature";
};

const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void;
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
    onKyp: (lease: any) => void;
    onAuthenticate: (lease: any) => void;
}

export default function LeaseTable({
    leases,
    onPrimary,
    onExtend,
    onEnd,
    onKyp,
    onAuthenticate,
}: Props) {
    return (
        <div
            id="units-list-section"
            className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                    <tr>
                        {["Unit / Tenant", "Start Date", "End Date", "Status", "eKYP ID", "Actions"].map(
                            (h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                                >
                                    {h}
                                </th>
                            ),
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {leases.map((lease) => {
                        const status = getStatus(lease);
                        const isActive = status === "active";

                        const StatusIcon = isActive
                            ? CheckCircle2
                            : status === "draft"
                            ? FileSignature
                            : status === "expired"
                            ? AlertCircle
                            : status.includes("signature")
                            ? FileSignature
                            : Clock;

                        const statusColor = isActive
                            ? "text-emerald-600"
                            : status === "draft"
                            ? "text-blue-600"
                            : status === "expired"
                            ? "text-red-600"
                            : status.includes("signature")
                            ? "text-amber-600"
                            : "text-gray-500";

                        return (
                            <tr key={lease.agreement_id || lease.lease_id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                            isActive ? "bg-emerald-100" :
                                            status === "draft" ? "bg-blue-100" :
                                            status === "expired" ? "bg-red-100" :
                                            status.includes("signature") ? "bg-amber-100" : "bg-gray-100"
                                        }`}>
                                            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-900">{lease.unit_name}</span>
                                            <p className="text-xs text-gray-500">{lease.tenant_name || "No tenant"}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {formatShortDate(lease.start_date)}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {formatShortDate(lease.end_date)}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <StatusBadge lease={lease} />
                                </td>

                                <td className="px-4 py-3">
                                    {isActive ? (
                                        <button
                                            onClick={() => onKyp(lease)}
                                            className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            View ID
                                        </button>
                                    ) : (
                                        <span className="inline-flex px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-400 rounded-lg">
                                            N/A
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-3">
                                    {status === "draft" && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            Setup
                                        </button>
                                    )}

                                    {requiresLandlordSignature(lease) && (
                                        <button
                                            onClick={() => onAuthenticate(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            Authenticate
                                        </button>
                                    )}

                                    {status === "expired" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onExtend(lease)}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                            >
                                                Extend
                                            </button>
                                            <button
                                                onClick={() => onEnd(lease)}
                                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                            >
                                                End
                                            </button>
                                        </div>
                                    )}

                                    {status === "active" && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
                                        >
                                            View <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {!["draft", "expired", "active", "pending_signature", "landlord_pending_signature"].includes(status) && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            View
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {leases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-base font-semibold text-gray-900">No leases found</p>
                    <p className="text-sm text-gray-500 mt-1">Leases will appear here once you set them up</p>
                </div>
            )}
        </div>
    );
}
