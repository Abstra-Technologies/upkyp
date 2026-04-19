/**
 * usePaymentsPage Hook
 * 
 * Used by: app/landlord/payments/page.tsx
 * 
 * Provides functionality for the payments/collections page.
 * - Manages filter state (search, payment type, status, date range)
 * - Fetches available years and properties for filtering
 * - Handles PDF report download
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";

interface Property {
    property_id: string;
    property_name: string;
}

export function usePaymentsPage() {
    const { user, loading: authLoading, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [search, setSearch] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [payoutStatus, setPayoutStatus] = useState("all");
    const [dateRange, setDateRange] = useState("all");

    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const [years, setYears] = useState<number[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

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

    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/${landlord_id}/properties`)
            .then((res) => res.json())
            .then((data) => setProperties(data?.data || []))
            .catch(() => setProperties([]));
    }, [landlord_id]);

    const clearFilters = useCallback(() => {
        setSearch("");
        setPaymentType("all");
        setPaymentStatus("all");
        setPayoutStatus("all");
        setDateRange("30");
        setCustomFrom("");
        setCustomTo("");
        setRefreshKey((prev) => prev + 1);
    }, []);

    const handleDownload = useCallback(async ({
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
            }, 600);
        } catch (error) {
            console.error("Failed to download report:", error);
            setIsDownloading(false);
            alert("Failed to download report. Please try again.");
        }
    }, [landlord_id]);

    const handleFromDateChange = useCallback((value: string) => {
        setCustomFrom(value);
        if (customTo && value) {
            setDateRange(`range:${value}:${customTo}`);
        }
    }, [customTo]);

    const handleToDateChange = useCallback((value: string) => {
        setCustomTo(value);
        if (customFrom && value) {
            setDateRange(`range:${customFrom}:${value}`);
        }
    }, [customFrom]);

    const handleMonthChange = useCallback((month: string) => {
        if (month) setDateRange(`month:${new Date().getFullYear()}:${month}`);
    }, []);

    return {
        loading: authLoading,
        landlord_id,
        
        search,
        setSearch,
        paymentType,
        setPaymentType,
        paymentStatus,
        setPaymentStatus,
        payoutStatus,
        setPayoutStatus,
        dateRange,
        setDateRange,
        
        customFrom,
        customTo,
        handleFromDateChange,
        handleToDateChange,
        
        years,
        properties,
        
        isDownloading,
        refreshKey,
        showFilters,
        setShowFilters,
        
        clearFilters,
        handleDownload,
        handleMonthChange,
    };
}