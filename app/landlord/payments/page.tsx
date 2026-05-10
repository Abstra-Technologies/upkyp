"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import PaymentSummaryGrid from "@/components/landlord/analytics/PaymentSummaryGrid";
import PaymentReportModal from "@/components/landlord/payments/PaymentReportModal";
import Link from "next/link";
import axios from "axios";

import {
    CreditCard,
    Search,
    Calendar,
    Wallet,
    Download,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    Info,
    X,
    Banknote,
    ArrowDownRight,
    Clock,
} from "lucide-react";


const PaymentsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-4 sm:pt-6 pb-5 px-3 sm:px-6">
            <div className="h-7 sm:h-8 bg-gray-200 rounded w-48 sm:w-60 animate-pulse mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 sm:h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

interface Property {
    property_id: string;
    property_name: string;
}

export default function PaymentsPage() {
    const { user, loading, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState("30");

    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const [years, setYears] = useState<number[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const clearFilters = () => {
        setSearch("");
        setDateRange("30");
        setCustomFrom("");
        setCustomTo("");
        setRefreshKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/payments/years?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => setYears(data?.years || []))
            .catch(() => setYears([]));
    }, [landlord_id]);

    /* =========================
       FETCH PROPERTIES
    ========================== */
    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/${landlord_id}/properties`)
            .then((res) => res.json())
            .then((data) => setProperties(data?.data || []))
            .catch(() => setProperties([]));
    }, [landlord_id]);

    const handleDownload = async ({
                                      property_id,
                                      year,
                                      month,
                                  }: {
        property_id: string | "all";
        year: string;
        month: string;
    }) => {
        try {
            setIsDownloading(true);

            const res = await axios.get(
                "/api/landlord/reports/paymentList",
                {
                    params: {
                        landlord_id,
                        property_id: property_id,
                        year,
                        month,
                    },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Payment_Report_${year}_${month}_${property_id}.pdf`;
            link.click();

            URL.revokeObjectURL(url);

            setTimeout(() => {
                setIsDownloading(false);
                setOpenReportModal(false);
            }, 600);
        } catch (error) {
            console.error("Failed to download report:", error);
            setIsDownloading(false);
            alert("Failed to download report. Please try again.");
        }
    };

    if (loading || !landlord_id) {
        return <PaymentsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ================= HEADER ================= */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-gray-200 pt-3 sm:pt-5 pb-3 sm:pb-5 px-3 sm:px-6"
            >
                {/* Title */}
                <div className="flex items-start gap-2.5 sm:gap-4 mb-3 sm:mb-5">

                    {/* Icon */}
                    <div className="w-9 h-9 sm:w-12 sm:h-12
                    bg-gradient-to-br from-blue-500 to-emerald-500
                    rounded-lg sm:rounded-xl
                    flex items-center justify-center
                    shadow-md sm:shadow-lg
                    flex-shrink-0">
                        <CreditCard className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    {/* Text Content */}
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                            Payment Transactions
                        </h1>

                        <p className="text-[11px] sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                            Track rent collections, fees, and payout status
                        </p>
                    </div>

                </div>

                {/* SUMMARY */}
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                    <PaymentSummaryGrid landlord_id={landlord_id} />

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <button
                            onClick={() => setOpenReportModal(true)}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50"
                        >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                            <span className="truncate">Report</span>
                        </button>

                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50"
                        >
                            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="truncate">What's This?</span>
                        </button>

                        <Link href="/landlord/payouts">
                            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:scale-95 transition w-full">
                                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="truncate">Disburse to Bank</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ================= FILTERS ================= */}
                
                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 mb-2"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                    {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Filter Section */}
                <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-2 sm:gap-3`}>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tenant, property, reference"
                            className="w-full sm:w-72 pl-9 sm:pl-11 pr-4 py-2 sm:py-2.5
                       border border-gray-200 rounded-lg sm:rounded-xl
                       bg-gray-50 focus:bg-white
                       focus:ring-2 focus:ring-blue-500/20
                       text-xs sm:text-sm"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => {
                                setDateRange(e.target.value);
                                setCustomFrom("");
                                setCustomTo("");
                            }}
                            className="w-full sm:w-44 appearance-none
                           pl-9 pr-8 py-2 sm:py-2.5
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="all">All Time</option>
                            {years.length > 0 && (
                                <optgroup label="By Year">
                                    {years.map((year) => (
                                        <option key={year} value={`year:${year}`}>
                                            {year}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Custom Date Range */}
                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => {
                                    setCustomFrom(e.target.value);
                                    if (customTo && e.target.value) {
                                        setDateRange(`range:${e.target.value}:${customTo}`);
                                    }
                                }}
                                className="flex-1 sm:flex-none sm:w-36 px-2.5 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs"
                            />
                            <span className="text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => {
                                    setCustomTo(e.target.value);
                                    if (customFrom && e.target.value) {
                                        setDateRange(`range:${customFrom}:${e.target.value}`);
                                    }
                                }}
                                className="flex-1 sm:flex-none sm:w-36 px-2.5 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs"
                            />
                        </div>
                    )}

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Clear
                    </button>

                </div>
            </motion.div>

            {/* ================= TABLE ================= */}
            <div className="px-3 sm:px-6 pt-3 sm:pt-6 pb-20 sm:pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm"
                >
                    <PaymentList
                        landlord_id={landlord_id}
                        search={search}
                        dateRange={dateRange}
                        refreshKey={refreshKey}
                    />
                </motion.div>
            </div>

            {/* ================= INFO MODAL ================= */}
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
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-emerald-600" />
                                Understanding Payments
                            </h2>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-5">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                                    Total Payment Transferred to Bank Account
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Payments that have been transferred to the bank account linked to your account.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    Pending Disbursement to Bank Account
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Payment that is waiting to be sent to their bank accounts.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ================= REPORT MODAL ================= */}
            <PaymentReportModal
                open={openReportModal}
                onClose={() => setOpenReportModal(false)}
                landlord_id={String(landlord_id)}
                properties={properties}
                isDownloading={isDownloading}
                onDownload={handleDownload}
            />
        </div>
    );
}
