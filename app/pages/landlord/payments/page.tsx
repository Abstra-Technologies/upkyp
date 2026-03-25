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
    Filter,
    Calendar,
    Wallet,
    Download,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
} from "lucide-react";

import {
    PAYMENT_TYPE_OPTIONS,
    PAYMENT_STATUS_OPTIONS,
    PAYOUT_STATUS_OPTIONS,
} from "@/constant/payments/paymentFilters";

/* =========================
   SKELETON
========================= */
const PaymentsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 px-6">
            <div className="h-8 bg-gray-200 rounded w-60 animate-pulse mb-4" />
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
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

    /* =========================
       STATE
    ========================== */
    const [search, setSearch] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [payoutStatus, setPayoutStatus] = useState("all");
    const [dateRange, setDateRange] = useState("all");

    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const [years, setYears] = useState<number[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const clearFilters = () => {
        setSearch("");
        setPaymentType("all");
        setPaymentStatus("all");
        setPayoutStatus("all");
        setDateRange("30");
        setCustomFrom("");
        setCustomTo("");
        setRefreshKey((prev) => prev + 1);
    };

    /* =========================
       AUTH
    ========================== */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* =========================
       FETCH YEARS
    ========================== */
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

    /* =========================
       DOWNLOAD REPORT
    ========================== */
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
                        property_id: property_id !== "all" ? property_id : undefined,
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
                className="bg-white border-b border-gray-200 pt-20 sm:pt-10 md:pt-6 pb-4 sm:pb-6 px-4 sm:px-6"
            >
                {/* Title */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">

                    {/* Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12
                    bg-gradient-to-br from-blue-500 to-emerald-500
                    rounded-lg sm:rounded-xl
                    flex items-center justify-center
                    shadow-md sm:shadow-lg
                    flex-shrink-0">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    {/* Text Content */}
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl lg:text-3xl
                       font-bold text-gray-900 leading-tight">
                            Payment Transactions
                        </h1>

                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Track rent collections, fees, and payout status
                        </p>
                    </div>

                </div>

                {/* SUMMARY */}
                <div className="mb-6 space-y-4">
                    <PaymentSummaryGrid landlord_id={landlord_id} />

                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        <button
                            onClick={() => setOpenReportModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            Download Report
                        </button>

                        <Link href="/pages/landlord/payouts">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:scale-95 transition">
                                <Wallet className="w-4 h-4" />
                                View Payouts
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ================= FILTERS ================= */}
                
                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-3"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Filter Section - Desktop always visible, Mobile collapsible */}
                <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3`}>

                    {/* Search */}
                    <div className="w-full sm:flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tenant, property, reference"
                            className="w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3
                       border border-gray-200 rounded-lg sm:rounded-xl
                       bg-gray-50 focus:bg-white
                       focus:ring-2 focus:ring-blue-500/20
                       text-xs sm:text-sm"
                        />
                    </div>

                    {/* Filter Row 1 - Mobile: 2 columns */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        {/* Payment Type */}
                        <div className="w-full sm:w-auto relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                                className="w-full appearance-none
                           pl-9 pr-8 py-2.5 sm:py-3
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                            >
                                {PAYMENT_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Status */}
                        <div className="w-full sm:w-auto relative">
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full appearance-none
                           px-4 py-2.5 sm:py-3
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                            >
                                {PAYMENT_STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payout Status */}
                        <div className="w-full sm:w-auto relative">
                            <select
                                value={payoutStatus}
                                onChange={(e) => setPayoutStatus(e.target.value)}
                                className="w-full appearance-none
                           px-4 py-2.5 sm:py-3
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                            >
                                {PAYOUT_STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="w-full sm:w-auto relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full appearance-none
                           pl-9 pr-8 py-2.5 sm:py-3
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                            >
                                <option value="all">All Time</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="month">This Month</option>
                                <option value="last_month">Last Month</option>

                                {years.length > 0 && (
                                    <optgroup label="By Year">
                                        {years.map((year) => (
                                            <option key={year} value={`year:${year}`}>
                                                {year}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Filter Row 2 - Mobile: Custom dates & Month */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        {/* Custom Date Range */}
                        <div className="col-span-2 sm:flex sm:items-center gap-2">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => {
                                    setCustomFrom(e.target.value);
                                    if (customTo && e.target.value) {
                                        setDateRange(`range:${e.target.value}:${customTo}`);
                                    }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs"
                            />
                            <span className="hidden sm:inline text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => {
                                    setCustomTo(e.target.value);
                                    if (customFrom && e.target.value) {
                                        setDateRange(`range:${customFrom}:${e.target.value}`);
                                    }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs"
                            />
                        </div>

                        {/* Month Filter */}
                        <div className="w-full sm:w-auto relative">
                            <select
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) setDateRange(`month:${new Date().getFullYear()}:${val}`);
                                }}
                                className="w-full appearance-none
                           px-4 py-2.5 sm:py-3
                           border border-gray-200 rounded-lg sm:rounded-xl
                           bg-gray-50 text-xs sm:text-sm"
                            >
                                <option value="">Select Month</option>
                                <option value="01">January</option>
                                <option value="02">February</option>
                                <option value="03">March</option>
                                <option value="04">April</option>
                                <option value="05">May</option>
                                <option value="06">June</option>
                                <option value="07">July</option>
                                <option value="08">August</option>
                                <option value="09">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Clear
                        </button>
                    </div>

                </div>
            </motion.div>

            {/* ================= TABLE ================= */}
            <div className="px-6 pt-6 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                    <PaymentList
                        landlord_id={landlord_id}
                        search={search}
                        paymentType={paymentType}
                        paymentStatus={paymentStatus}
                        payoutStatus={payoutStatus}
                        dateRange={dateRange}
                        refreshKey={refreshKey}
                    />
                </motion.div>
            </div>

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
