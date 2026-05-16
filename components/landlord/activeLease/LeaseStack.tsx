"use client";

import { useState, useEffect } from "react";
import { User2, QrCode, ArrowRight, Calendar, Clock, AlertCircle, CheckCircle2, FileSignature, ChevronRight, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

const formatShort = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void;
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
    onCancel: (lease: any) => void;
    onKyp: (lease: any) => void;
}

export default function LeaseStack({
    leases,
    onPrimary,
    onExtend,
    onEnd,
    onCancel,
    onKyp,
}: Props) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const toggleMenu = (e: React.MouseEvent, leaseId: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === leaseId ? null : leaseId);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openMenuId && !(e.target as HTMLElement).closest('.lease-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [openMenuId]);

    return (
        <div id="units-list-section-mobile" className="block md:hidden space-y-2 mb-4">
            {leases.map((lease) => {
                const status = getStatus(lease);
                const isActive = status === "active";
                const daysLeft = isActive ? getDaysRemaining(lease.end_date) : null;
                const isExpiringSoon = daysLeft !== null && daysLeft <= 60 && daysLeft >= 0;

                const dotColor = isActive
                    ? "bg-emerald-500"
                    : status === "draft"
                    ? "bg-blue-500"
                    : status === "expired"
                    ? "bg-red-500"
                    : status.includes("signature")
                    ? "bg-amber-500"
                    : "bg-gray-400";

                const dateLabel = isActive && daysLeft !== null
                    ? `${formatShort(lease.end_date)} · ${daysLeft}d left`
                    : `${formatShort(lease.start_date)} – ${formatShort(lease.end_date)}`;

                return (
                    <div
                        key={lease.agreement_id || lease.lease_id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible active:scale-[0.99] transition-transform"
                    >
                        <div className="flex items-stretch">
                            {/* Color dot + Unit info */}
                            <div
                                className="flex-1 px-3 py-2.5 flex items-center gap-2.5 min-w-0 cursor-pointer"
                                onClick={() => onPrimary(lease)}
                            >
                                <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${dotColor}`} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-gray-900 truncate">{lease.unit_name}</p>
                                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                                    </div>

                                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                        <User2 className="w-3 h-3" />
                                        {lease.tenant_name || "No tenant"}
                                    </p>

                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>{dateLabel}</span>
                                        </div>
                                        {isExpiringSoon && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                                                Expiring
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status badge + Action */}
                            <div className="flex flex-col items-end justify-between px-2 py-2.5 gap-2">
                                <StatusBadge lease={lease} />

                                <div className="flex items-center gap-1.5">
                                    {status === "draft" && (
                                        <>
                                            <button
                                                onClick={() => onPrimary(lease)}
                                                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                                            >
                                                Setup
                                            </button>
                                            <button
                                                onClick={() => onCancel(lease)}
                                                className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}

                                    {status === "expired" && (
                                        <>
                                            <button
                                                onClick={() => onExtend(lease)}
                                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                                            >
                                                Extend
                                            </button>
                                            <button
                                                onClick={() => onEnd(lease)}
                                                className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold"
                                            >
                                                End
                                            </button>
                                        </>
                                    )}

                                    {isActive && (
                                        <div className="relative lease-menu-container">
                                            <button
                                                onClick={(e) => toggleMenu(e, lease.lease_id)}
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            {openMenuId === lease.lease_id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                                                    <button
                                                        onClick={() => {
                                                            onPrimary(lease);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View Details
                                                    </button>
                                                    {lease.end_date && (
                                                        <button
                                                            onClick={() => {
                                                                onExtend(lease);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Extend Lease
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            onEnd(lease);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        End Lease
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!["draft", "expired", "active"].includes(status) && (
                                        <button
                                            onClick={() => onPrimary(lease)}
                                            className="px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                        >
                                            View <ArrowRight className="w-3 h-3" />
                                        </button>
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
