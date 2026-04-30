"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";
import {
    Calculator,
    TrendingUp,
    Calendar,
    Building2,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Receipt,
    AlertCircle,
} from "lucide-react";

interface SummaryData {
    hasActiveSubscription: boolean;
    planName: string | null;
    basePrice: number;
    currentMonthUnits: number;
    currentMonthUnitCost: number;
    currentMonthCharge: number;
    totalBilled: number;
    unitsByType: { type: string; count: number; price: number; subtotal: number }[];
}

interface SnapshotData {
    snapshot_id: number;
    billing_month: string;
    units_used: number;
    applied_floor_price: number;
    applied_unit_price: number;
    total_computed: number;
    final_charge: number;
    created_at: string;
    plan_name: string;
    plan_base_price: number;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function StatCard({ icon: Icon, label, value, subtext, colorClass }: {
    icon: React.ElementType;
    label: string;
    value: string;
    subtext?: string;
    colorClass: string;
}) {
    return (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
                </div>
            </div>
        </div>
    );
}

function formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

export default function LandlordBillingPage() {
    const { user, loading, fetchSession } = useAuthStore();
    const landlordId = user?.landlord_id as string | undefined;
    const [page, setPage] = useState(1);

    const { data: summaryData, isLoading: summaryLoading } = useSWR<{ data: SummaryData }>(
        landlordId ? `/api/landlord/billing/summary` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    const { data: snapshotsData, isLoading: snapshotsLoading } = useSWR<{ data: SnapshotData[]; pagination: PaginationData }>(
        landlordId ? `/api/landlord/billing/snapshots?page=${page}&limit=10` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    if (loading || summaryLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading billing data...</p>
                </div>
            </div>
        );
    }

    if (!landlordId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Authentication Required</h3>
                    <p className="text-xs text-gray-500">Please log in to view your billing information.</p>
                </div>
            </div>
        );
    }

    const summary = summaryData?.data;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                    <p className="text-sm text-gray-500 mt-1">View your monthly billing history and current charges</p>
                </div>

                {!summary?.hasActiveSubscription ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Active Subscription</h3>
                        <p className="text-xs text-gray-500">Subscribe to a plan to start tracking your billing.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatCard
                                icon={Calculator}
                                label="Plan Base Price"
                                value={`₱${summary.basePrice.toLocaleString()}`}
                                subtext={summary.planName || ""}
                                colorClass="bg-blue-50 text-blue-600"
                            />
                            <StatCard
                                icon={Building2}
                                label="Current Month Units"
                                value={`${summary.currentMonthUnits}`}
                                subtext="Total units across all properties"
                                colorClass="bg-emerald-50 text-emerald-600"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Current Month Charge"
                                value={`₱${summary.currentMonthCharge.toLocaleString()}`}
                                subtext={summary.currentMonthCharge > summary.basePrice ? "Based on unit usage" : "Floor price applied"}
                                colorClass="bg-violet-50 text-violet-600"
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Total Billed (All Time)"
                                value={`₱${summary.totalBilled.toLocaleString()}`}
                                subtext="Lifetime billing total"
                                colorClass="bg-amber-50 text-amber-600"
                            />
                        </div>

                        {summary.unitsByType.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-xl border border-slate-200 p-4 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-gray-900">Current Month Breakdown</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {summary.unitsByType.map(({ type, count, price, subtotal }) => (
                                        <div key={type} className="bg-white/70 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-700 capitalize">{type}</span>
                                                <span className="text-sm font-bold text-gray-900">₱{subtotal.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">{count} units × ₱{Number(price).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-900">Billing History</h3>
                                </div>
                            </div>

                            {snapshotsLoading ? (
                                <div className="px-4 py-6">
                                    <div className="animate-pulse space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                                        ))}
                                    </div>
                                </div>
                            ) : !snapshotsData?.data || snapshotsData.data.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-xs text-gray-500">No billing history yet. Snapshots are generated monthly.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Billing Period</th>
                                                    <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Plan</th>
                                                    <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Units</th>
                                                    <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Floor Price</th>
                                                    <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Computed</th>
                                                    <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Final Charge</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {snapshotsData.data.map((snapshot) => (
                                                    <tr key={snapshot.snapshot_id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs font-medium text-gray-900">{formatMonth(snapshot.billing_month)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs text-gray-600">{snapshot.plan_name}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-xs font-semibold text-gray-900">{snapshot.units_used}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-xs text-gray-600">₱{Number(snapshot.applied_floor_price).toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-xs text-gray-600">₱{Number(snapshot.total_computed).toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-xs font-bold ${
                                                                snapshot.final_charge > snapshot.applied_floor_price
                                                                    ? "text-emerald-600"
                                                                    : "text-blue-600"
                                                            }`}>
                                                                ₱{Number(snapshot.final_charge).toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {snapshotsData.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500">
                                                Page {snapshotsData.pagination.page} of {snapshotsData.pagination.totalPages}
                                                <span className="ml-1">({snapshotsData.pagination.total} total)</span>
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setPage((p) => Math.min(snapshotsData.pagination.totalPages, p + 1))}
                                                    disabled={page === snapshotsData.pagination.totalPages}
                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
