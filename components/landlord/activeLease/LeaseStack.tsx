"use client";

import { Building2, User2, QrCode, Calendar, ArrowRight } from "lucide-react";
import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void;
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
    onKyp: (lease: any) => void;
}

export default function LeaseStack({
    leases,
    onPrimary,
    onExtend,
    onEnd,
    onKyp,
}: Props) {
    return (
        <div id="units-list-section-mobile" className="block md:hidden space-y-2 mb-4">
            <div className="px-1 mb-2">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Units ({leases.length})
                </h3>
            </div>
            {leases.map((lease) => {
                const status = getStatus(lease);
                const isActive = status === "active";

                return (
                    <div
                        key={lease.agreement_id || lease.lease_id}
                        className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                    <Building2 className="w-3.5 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 truncate">{lease.unit_name}</h3>
                                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                        <User2 className="w-2.5 h-2.5" />
                                        {lease.tenant_name || "No tenant"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                                        <Calendar className="w-2.5 h-2.5" />
                                        {lease.end_date
                                            ? new Date(lease.end_date).toLocaleDateString()
                                            : "—"}
                                    </p>
                                    <div className="mt-0.5">
                                        <StatusBadge lease={lease} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 space-y-1.5">
                            {status === "draft" && (
                                <button
                                    onClick={() => onPrimary(lease)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                >
                                    Setup Lease <ArrowRight className="w-3 h-3" />
                                </button>
                            )}

                            {status === "expired" && (
                                <>
                                    <button
                                        onClick={() => onExtend(lease)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                    >
                                        Extend Lease
                                    </button>
                                    <button
                                        onClick={() => onEnd(lease)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                    >
                                        End Lease
                                    </button>
                                </>
                            )}

                            {isActive && (
                                <>
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                    >
                                        View Details <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onKyp(lease)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                    >
                                        <QrCode className="w-3 h-3" /> View eKYP ID
                                    </button>
                                </>
                            )}

                            {!["draft", "expired", "active"].includes(status) && (
                                <button
                                    onClick={() => onPrimary(lease)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                                >
                                    View Details <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
