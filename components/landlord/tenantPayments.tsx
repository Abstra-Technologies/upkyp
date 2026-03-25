"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils/formatter/formatters";
import {
    Eye,
    Receipt,
    AlertCircle,
    Inbox,
    Clock,
    MapPin,
    ArrowRight,
    RefreshCw,
    CheckCircle,
    Info,
    X,
} from "lucide-react";
import axios from "axios";
import PaymentDetailsModal from "@/components/landlord/payments/PaymentDetailsModal";

/* =========================
        FETCHER
========================== */
const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to fetch payments");
    return data;
};

interface Props {
    landlord_id?: string;
    search?: string;
    paymentType?: string;
    paymentStatus?: string;
    payoutStatus?: string;
    dateRange?: string;
    refreshKey?: number;
}

/* =========================
        ANIMATIONS
========================== */
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

export default function PaymentList({
                                        landlord_id,
                                        search = "",
                                        paymentType = "all",
                                        paymentStatus = "all",
                                        payoutStatus = "all",
                                        dateRange = "30",
                                        refreshKey = 0,
                                    }: Props) {
    /* =========================
          STATE
    ========================== */
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [openModal, setOpenModal] = useState(false);

    const openDetails = (payment: any) => {
        setSelectedPayment(payment);
        setOpenModal(true);
    };

    const [isCheckingSettlement, setIsCheckingSettlement] = useState(false);
    const [settlementMessage, setSettlementMessage] = useState<string | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const checkSettlement = async () => {
        if (!landlord_id) return;
        setIsCheckingSettlement(true);
        setSettlementMessage(null);
        try {
            const res = await axios.get(`/api/landlord/payments/checkSettlement?landlord_id=${landlord_id}`);
            const transferred = res.data.results?.filter((r: any) => r.status === "transferred").length || 0;
            const pending = res.data.results?.filter((r: any) => r.status === "pending").length || 0;
            setSettlementMessage(`Checked: ${transferred} transferred, ${pending} pending settlement`);
        } catch (err: any) {
            setSettlementMessage("Error checking settlement");
        } finally {
            setIsCheckingSettlement(false);
        }
    };

    const query = useMemo(() => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (paymentType !== "all") params.set("paymentType", paymentType);
        if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
        if (payoutStatus !== "all") params.set("payoutStatus", payoutStatus);
        if (dateRange) params.set("dateRange", dateRange);

        return params.toString();
    }, [search, paymentType, paymentStatus, payoutStatus, dateRange]);

    const {
        data: payments = [],
        isLoading,
        error,
    } = useSWR(
        landlord_id
            ? `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}&${query}&_t=${refreshKey}`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 0 },
    );

    /* =========================
          LOADING
    ========================== */
    if (isLoading) {
        return (
            <div className="divide-y divide-gray-100">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-5 animate-pulse">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                            <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* =========================
          ERROR
    ========================== */
    if (error) {
        return (
            <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Something went wrong</p>
                <p className="text-sm text-red-500">{(error as Error).message}</p>
            </div>
        );
    }

    /* =========================
          EMPTY
    ========================== */
    if (!payments.length) {
        return (
            <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Inbox className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">
                    No payment records found
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                    Try adjusting your filters or check back later
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Settlement Check Button */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <button
                    onClick={checkSettlement}
                    disabled={isCheckingSettlement}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isCheckingSettlement ? "animate-spin" : ""}`} />
                    {isCheckingSettlement ? "Checking..." : "Check Settlement"}
                </button>
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Payment Info</span>
                </button>
                {settlementMessage && (
                    <span className="flex items-center gap-2 text-sm text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        {settlementMessage}
                    </span>
                )}
            </div>

            {/* =========================
        DESKTOP TABLE
    ========================== */}
            <div className="hidden lg:block">
                <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 px-6 py-4">
                    <div>Date Paid</div>
                    <div>Tenant</div>
                    <div>Property / Unit</div>
                    {/*<div>Type</div>*/}
                    <div className="text-right">Amount Paid</div>
                    <div className="text-right">Net Amount</div>
                    <div className="text-center">Payment Status</div>
                    <div className="text-center">Action</div>
                </div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-gray-100"
                >
                    {payments.map((payment: any) => (
                        <motion.div
                            key={payment.payment_id}
                            variants={fadeInUp}
                            className="grid grid-cols-8 items-center px-6 py-4 text-sm
            hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-emerald-50/50 transition-colors"
                        >
                            {/* Date */}
                            <div>
                                <p className="text-gray-700 font-medium">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                </p>
                                {/*<p className="text-[11px] text-gray-400">*/}
                                {/*   {payment.created_at}*/}
                                {/*</p>*/}
                            </div>


                            {/* Tenant */}
                            <div className="font-semibold text-gray-900">
                                {payment.tenant_name || "—"}
                            </div>

                            {/* Property / Unit */}
                            <div className="text-gray-600">
                                {payment.property_name} •{" "}
                                <span className="text-gray-500">{payment.unit_name}</span>
                            </div>

                            {/* Type */}
                            {/*<PaymentTypeBadge type={payment.payment_type} />*/}

                            {/* Gross Amount (Tenant Paid) */}
                            <div className="text-right font-semibold text-gray-900">
                                {formatCurrency(payment.gross_amount || payment.amount_paid)}
                                <p className="text-[11px] text-gray-400 font-normal">
                                    Tenant Paid
                                </p>
                            </div>

                            {/* Net Amount (Landlord Receives) */}
                            <div className="text-right font-bold text-emerald-600">
                                {formatCurrency(payment.net_amount || payment.amount_paid)}
                                <p className="text-[11px] text-gray-400 font-normal">
                                    After Fees
                                </p>
                            </div>

                            {/* Status */}
                            <div className="text-center">
                                <StatusBadge status={payment.payment_status} />
                            </div>

                            {/* Action */}
                            <div className="text-center">
                                <button
                                    onClick={() => openDetails(payment)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* =========================
        MOBILE CARDS
    ========================== */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="lg:hidden divide-y divide-gray-100"
            >
                {payments.map((payment: any) => (
                    <motion.div
                        key={payment.payment_id}
                        variants={fadeInUp}
                        className="py-3 px-4"
                    >
                        {/* Top Row */}
                        <div className="flex items-center justify-between gap-3">

                            {/* Left */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                    <Receipt className="w-4 h-4 text-blue-600" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {payment.tenant_name || "—"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                        {payment.property_name} • {payment.unit_name}
                                    </p>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-emerald-600">
                                    {formatCurrency(payment.net_amount || payment.amount_paid)}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="mt-2 flex items-center justify-between">
                            <StatusBadge status={payment.payment_status} />

                            <button
                                onClick={() => openDetails(payment)}
                                className="text-xs text-blue-600 font-semibold flex items-center gap-1"
                            >
                                Details
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* =========================
        MODAL
    ========================== */}
            <PaymentDetailsModal
                open={openModal}
                payment={selectedPayment}
                onClose={() => setOpenModal(false)}
            />

            {/* Settlement Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowInfoModal(false)}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                Payment Breakdown
                            </h2>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {/* Settlement Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    What is Settlement?
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Settlement is when Xendit confirms the payment has been successfully processed and funds are available for transfer. Once settled, the net amount (after fees) will be transferred to your account.
                                </p>
                            </div>

                            {/* Payment Parts Table */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                    Payment Parts
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm text-gray-700">Gross Amount</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Amount tenant paid</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-sm text-gray-700">Gateway Fee</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Xendit processing fee</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-sm text-gray-700">VAT</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Value-added tax on fee</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            <span className="text-sm text-gray-700">Withholding Tax</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Tax deducted by Xendit</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-semibold text-gray-900">Net Amount</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">Amount you receive</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Status */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-amber-600" />
                                    Settlement Status
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <span className="block text-xs text-amber-600 font-medium">Pending</span>
                                        <span className="text-amber-800">Awaiting settlement</span>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <span className="block text-xs text-emerald-600 font-medium">Settled</span>
                                        <span className="text-emerald-800">Ready for transfer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );

}

/* =========================
        BADGES
========================== */

function PaymentTypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        monthly_rent: "bg-blue-50 text-blue-700 border-blue-100",
        monthly_billing: "bg-indigo-50 text-indigo-700 border-indigo-100",
        monthly_utilities: "bg-amber-50 text-amber-700 border-amber-100",
        security_payment: "bg-purple-50 text-purple-700 border-purple-100",
        advance_payment: "bg-emerald-50 text-emerald-700 border-emerald-100",
        penalty: "bg-red-50 text-red-700 border-red-100",
        reservation_fee: "bg-cyan-50 text-cyan-700 border-cyan-100",
    };

    return (
        <span
            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                styles[type] || "bg-gray-50 text-gray-700 border-gray-100"
            }`}
        >
      {type.replaceAll("_", " ")}
    </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        failed: "bg-red-100 text-red-700 border-red-200",
        cancelled: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
        <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                styles[status] || styles.cancelled
            }`}
        >
      {status}
    </span>
    );
}
