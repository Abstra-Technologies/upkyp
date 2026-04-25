"use client";

import { Building2, QrCode, ArrowRight } from "lucide-react";
import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

const requiresLandlordSignature = (lease: any) => {
    const status = getStatus(lease);
    return status === "pending_signature";
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
            className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-transparent">
                    <tr>
                        {["Unit", "Start Date", "End Date", "Status", "eKYP ID", "Actions"].map(
                            (h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
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

                        return (
                            <tr key={lease.agreement_id || lease.lease_id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                                            <Building2 className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-900">{lease.unit_name}</span>
                                            <p className="text-xs text-gray-500">{lease.tenant_name || "No tenant"}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                        {lease.start_date
                                            ? new Date(lease.start_date).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                        {lease.end_date
                                            ? new Date(lease.end_date).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <StatusBadge lease={lease} />
                                </td>

                                <td className="px-4 py-3">
                                    {status === "active" ? (
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
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                                        >
                                            Setup
                                        </button>
                                    )}

                                    {requiresLandlordSignature(lease) && (
                                        <button
                                            onClick={() => onAuthenticate(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                                        >
                                            Authenticate
                                        </button>
                                    )}

                                    {status === "expired" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onExtend(lease)}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                                            >
                                                Extend
                                            </button>
                                            <button
                                                onClick={() => onEnd(lease)}
                                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                                            >
                                                End
                                            </button>
                                        </div>
                                    )}

                                    {status === "active" && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg text-xs font-bold shadow-md shadow-slate-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                                        >
                                            View
                                        </button>
                                    )}

                                    {!["draft", "expired", "active", "pending_signature"].includes(status) && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg text-xs font-bold shadow-md shadow-slate-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
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
        </div>
    );
}
