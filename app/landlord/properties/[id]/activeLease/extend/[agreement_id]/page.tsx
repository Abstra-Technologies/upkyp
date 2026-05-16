"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import {
    CalendarDays,
    ArrowLeft,
    Loader2,
    RefreshCcw,
    FileText,
    Building2,
    User,
    DoorOpen,
    CalendarRange,
    Banknote,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

export default function ExtendOrRenewLeasePage() {
    const router = useRouter();
    const params = useParams() as {
        id?: string;
        agreement_id?: string;
    };

    const { id, agreement_id } = params;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lease, setLease] = useState<any>(null);

    const [newEndDate, setNewEndDate] = useState("");
    const [newRent, setNewRent] = useState("");

    if (!agreement_id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 text-sm font-medium">Invalid lease reference.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const fetchLease = async () => {
            try {
                const res = await axios.get(
                    "/api/landlord/activeLease/getByAgreementId",
                    { params: { agreement_id } }
                );

                setLease(res.data);

                if (res.data?.end_date) {
                    const d = new Date(res.data.end_date);
                    d.setFullYear(d.getFullYear() + 1);
                    setNewEndDate(d.toISOString().split("T")[0]);
                }
            } catch {
                Swal.fire("Error", "Failed to load lease data.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchLease();
    }, [agreement_id]);

    const mode = useMemo<"extend" | "renew" | "blocked">(() => {
        if (!lease?.lease_status) return "blocked";

        if (["expired", "completed"].includes(lease.lease_status))
            return "renew";

        if (lease.lease_status === "active") return "extend";

        return "blocked";
    }, [lease]);

    const handleSubmit = async () => {
        if (!newEndDate) {
            Swal.fire("Missing field", "Select a new end date.", "warning");
            return;
        }

        setSubmitting(true);

        try {
            await axios.post("/api/landlord/activeLease/extend", {
                agreement_id,
                new_end_date: newEndDate,
                new_rent_amount: newRent || null,
            });

            Swal.fire({
                title: mode === "renew" ? "Lease Renewed" : "Lease Extended",
                icon: "success",
                confirmButtonColor: "#059669",
            }).then(() => {
                router.push(`/landlord/properties/${id}/activeLease`);
            });
        } catch {
            Swal.fire("Error", "Failed to process lease.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <p className="text-gray-600 text-sm">Loading lease details…</p>
            </div>
        );
    }

    if (mode === "blocked") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm font-medium">This lease cannot be extended or renewed.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const isRenew = mode === "renew";

    return (
        <div className="min-h-screen bg-gray-50 pt-16 md:pt-6">
            {/* HEADER BAR */}
            <div className={`px-4 py-4 ${isRenew ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-gradient-to-r from-emerald-600 to-teal-600"}`}>
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/landlord/properties/${id}/activeLease`)}
                        className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="w-px h-6 bg-white/20" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            {isRenew ? (
                                <RefreshCcw className="w-5 h-5 text-white" />
                            ) : (
                                <CalendarDays className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-white">
                                {isRenew ? "Renew Lease" : "Extend Lease"}
                            </h1>
                            <p className="text-xs md:text-sm text-white/70">
                                {isRenew ? "Create a new lease term" : "Extend the current lease"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {/* LEASE SUMMARY CARD */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900">Lease Summary</h2>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-gray-500">Property</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{lease.property_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                    <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-gray-500">Unit</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{lease.unit_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                    <User className="w-3.5 h-3.5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-gray-500">Tenant</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{lease.tenant_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <Banknote className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-gray-500">Current Rent</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{formatCurrency(Number(lease.rent_amount || 0))}/mo</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                <CalendarRange className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500">Current End Date</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(lease.end_date)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEASE DOCUMENT LINK */}
                {lease.agreement_url && (
                    <a
                        href={lease.agreement_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">View Lease Document</p>
                            <p className="text-xs text-gray-500 truncate">Open the original lease agreement</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                )}

                {/* FORM CARD */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {isRenew ? "New Lease Terms" : "Extension Details"}
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                New End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                            {newEndDate && lease.end_date && (
                                <p className="text-xs text-gray-500 mt-1.5">
                                    {formatDate(lease.end_date)} → {formatDate(newEndDate)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                New Monthly Rent <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
                                <input
                                    type="number"
                                    value={newRent}
                                    onChange={(e) => setNewRent(e.target.value)}
                                    placeholder={Number(lease.rent_amount || 0).toLocaleString()}
                                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            {newRent && Number(newRent) !== Number(lease.rent_amount || 0) && (
                                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    {formatCurrency(Number(lease.rent_amount || 0))} → {formatCurrency(Number(newRent))}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-3 pb-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !newEndDate}
                        className={`w-full px-6 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            submitting || !newEndDate
                                ? "bg-gray-300 cursor-not-allowed"
                                : isRenew
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                        }`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing…
                            </>
                        ) : (
                            <>
                                {isRenew ? <RefreshCcw className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                                {isRenew ? "Confirm Renewal" : "Confirm Extension"}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => router.push(`/landlord/properties/${id}/activeLease`)}
                        className="w-full px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
