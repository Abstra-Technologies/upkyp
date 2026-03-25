"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import Link from "next/link";
import {
    Wallet,
    ArrowDownCircle,
    RefreshCw,
    XCircle,
    ChevronRight,
    Building2,
    Home,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

const PayoutsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 px-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" />
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

export default function PayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const fetchPayouts = async () => {
        try {
            if (!isRefreshing) setLoading(true);
            const res = await fetch(`/api/landlord/payout?landlord_id=${landlordId}`);
            if (!res.ok) throw new Error("Failed to load payouts");

            const data = await res.json();
            setPayouts(data.payouts || []);
            setPendingPayments(data.pending_payments || []);
            setPendingTotal(data.pending_total || 0);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchPayouts();
    };

    useEffect(() => {
        if (landlordId) fetchPayouts();
    }, [landlordId]);

    const processingAmount = pendingPayments
        .filter((p) => p.payout_status === "in_payout")
        .reduce((sum, p) => sum + Number(p.net_amount), 0);

    const disbursedAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

    const statusConfig = (status: string) => {
        switch (status) {
            case "completed":
                return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle };
            case "processing":
                return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Clock };
            case "pending":
                return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: AlertCircle };
            case "failed":
                return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: XCircle };
            default:
                return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: Clock };
        }
    };

    if (loading) {
        return <PayoutsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-gray-200 pt-20 sm:pt-10 md:pt-6 pb-4 sm:pb-6 px-4 sm:px-6"
            >
                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg shrink-0">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                Payout Dashboard
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                Monitor earnings and disbursement history
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0">
                    <SummaryCard
                        label="Pending Disbursement"
                        amount={pendingTotal}
                        color="emerald"
                        icon={ArrowDownCircle}
                    />
                    <SummaryCard
                        label="Processing"
                        amount={processingAmount}
                        color="amber"
                        icon={Clock}
                    />
                    <SummaryCard
                        label="Disbursed"
                        amount={disbursedAmount}
                        color="blue"
                        icon={CheckCircle}
                    />
                </div>
            </motion.div>

            <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 lg:space-y-6">
                <div className="lg:hidden">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                                activeTab === "pending"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500"
                            }`}
                        >
                            Pending Disbursement
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                                activeTab === "history"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500"
                            }`}
                        >
                            Disbursed Payments
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
                            activeTab === "history" ? "hidden lg:block" : ""
                        }`}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
                                Pending Disbursement to Landlord
                            </h2>
                            <span className="text-xs sm:text-sm text-gray-500">
                                {pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <>
                                {pendingPayments.length === 0 ? (
                                    <div className="p-8 sm:p-12 text-center">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">No pending disbursement</p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Payments will appear here once confirmed</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                                        {pendingPayments.map((p, i) => (
                                            <motion.div
                                                key={p.payment_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50/50 transition"
                                            >
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {p.property_name} • {p.unit_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {p.payment_type?.replaceAll("_", " ")}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm sm:text-base font-bold text-emerald-600">
                                                        ₱{Number(p.net_amount).toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-400">
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </>
                        </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
                            activeTab === "pending" ? "hidden lg:block" : ""
                        }`}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
                                Disbursed Payments
                            </h2>
                            <span className="text-xs sm:text-sm text-gray-500">
                                {payouts.length} payout{payouts.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <>
                                {payouts.length === 0 ? (
                                    <div className="p-8 sm:p-12 text-center">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <ArrowDownCircle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">No payouts yet</p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Your payout history will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                                        {payouts.map((p, i) => {
                                            const config = statusConfig(p.status);
                                            const StatusIcon = config.icon;
                                            return (
                                                <motion.div
                                                    key={p.payout_id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50/50 transition"
                                                >
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 ${config.bg} rounded-lg flex items-center justify-center shrink-0`}>
                                                        <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.text}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            Payout #{p.payout_id}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{p.date}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{p.payout_method}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                                                        <div>
                                                            <p className="text-sm sm:text-base font-bold text-gray-900">
                                                                ₱{Number(p.amount).toLocaleString()}
                                                            </p>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.text}`}>
                                                                <StatusIcon className="w-2.5 h-2.5" />
                                                                {p.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                    </motion.div>
                </div>

                <div className="flex justify-center pb-8">
                    <Link
                        href="/pages/landlord/payments"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:text-blue-600 transition"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Payments
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    amount,
    color,
    icon: Icon,
}: {
    label: string;
    amount: number;
    color: "emerald" | "amber" | "blue";
    icon: any;
}) {
    const colors = {
        emerald: "text-emerald-600",
        amber: "text-amber-600",
        blue: "text-blue-600",
    };

    const bgColors = {
        emerald: "bg-emerald-50",
        amber: "bg-amber-50",
        blue: "bg-blue-50",
    };

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-2.5 sm:p-5 min-w-[100px] sm:min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-3 mb-0.5 sm:mb-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 ${bgColors[color]} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${colors[color]}`} />
                </div>
                <span className="text-[10px] sm:text-sm text-gray-500 font-medium truncate">{label}</span>
            </div>
            <p className={`text-base sm:text-2xl lg:text-3xl font-bold ${colors[color]} truncate`}>
                ₱{amount.toLocaleString()}
            </p>
        </div>
    );
}
