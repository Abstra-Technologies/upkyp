"use client";

import { Building2, User2, QrCode } from "lucide-react";
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
        <div className="space-y-3 md:hidden">
            {leases.map((lease) => {
                const status = getStatus(lease);
                const isActive = status === "active";

                return (
                    <div
                        key={lease.agreement_id || lease.lease_id}
                        className="bg-white border rounded-lg p-3 shadow-sm"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    {lease.unit_name}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <User2 className="w-3.5 h-3.5" />
                                    {lease.tenant_name || "—"}
                                </p>
                            </div>

                            <StatusBadge lease={lease} />
                        </div>

                        {/* Dates */}
                        <div className="flex justify-between text-xs text-gray-500 mb-3">
                            <span>
                                Start:{" "}
                                {lease.start_date
                                    ? new Date(lease.start_date).toLocaleDateString()
                                    : "—"}
                            </span>
                            <span>
                                End:{" "}
                                {lease.end_date
                                    ? new Date(lease.end_date).toLocaleDateString()
                                    : "—"}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-1.5">
                            {/* Draft → Setup */}
                            {status === "draft" && (
                                <button
                                    onClick={() => onPrimary(lease)}
                                    className="w-full py-2 text-sm bg-blue-600 text-white rounded-md"
                                >
                                    Setup
                                </button>
                            )}

                            {/* Expired → Extend + End */}
                            {status === "expired" && (
                                <>
                                    <button
                                        onClick={() => onExtend(lease)}
                                        className="w-full py-2 text-sm bg-emerald-600 text-white rounded-md"
                                    >
                                        Extend
                                    </button>
                                    <button
                                        onClick={() => onEnd(lease)}
                                        className="w-full py-2 text-sm bg-red-600 text-white rounded-md"
                                    >
                                        End
                                    </button>
                                </>
                            )}

                            {/* Active → View */}
                            {isActive && (
                                <button
                                    onClick={() => onPrimary(lease)}
                                    className="w-full py-2 text-sm bg-gray-800 text-white rounded-md"
                                >
                                    View
                                </button>
                            )}

                            {/* Active → eKYP */}
                            {isActive && (
                                <button
                                    onClick={() => onKyp(lease)}
                                    className="w-full py-2 text-sm flex items-center justify-center gap-2
                                               bg-indigo-600 text-white rounded-md"
                                >
                                    <QrCode className="w-4 h-4" />
                                    View eKYP ID
                                </button>
                            )}

                            {/* Fallback */}
                            {!["draft", "expired", "active"].includes(status) && (
                                <button
                                    onClick={() => onPrimary(lease)}
                                    className="w-full py-2 text-sm bg-gray-800 text-white rounded-md"
                                >
                                    View
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
