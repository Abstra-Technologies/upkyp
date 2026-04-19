/**
 * usePayoutsPage Hook
 * 
 * Used by: app/landlord/payouts/page.tsx
 * 
 * Provides functionality for the payouts dashboard page.
 * - Fetches payouts and pending payments
 * - Calculates summary amounts
 * - Handles refresh functionality
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import useAuthStore from "@/zustand/authStore";

interface Payout {
    payout_id: number;
    amount: number;
    status: string;
    date: string;
    payout_method: string;
}

interface PendingPayment {
    payment_id: number;
    property_name: string;
    unit_name: string;
    payment_type: string;
    net_amount: number;
    gross_amount?: number;
    amount_paid?: number;
    payout_status: string;
    gateway_settlement_status: string;
    created_at: string;
}

export function usePayoutsPage() {
    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
    const [showInfoModal, setShowInfoModal] = useState(false);

    const fetchPayouts = useCallback(async () => {
        try {
            if (!isRefreshing) setLoading(true);
            const res = await fetch(`/api/landlord/payout?landlord_id=${landlordId}`);
            if (!res.ok) throw new Error("Failed to load payouts");

            const data = await res.json();
            setPayouts(data.payouts || []);
            setPendingPayments(data.pending_payments || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [landlordId, isRefreshing]);

    useEffect(() => {
        if (landlordId) fetchPayouts();
    }, [landlordId, fetchPayouts]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchPayouts();
    }, [fetchPayouts]);

    const calculatedPendingTotal = useMemo(() => {
        return pendingPayments.reduce((sum, p) => {
            return sum + Number(p.net_amount || 0);
        }, 0);
    }, [pendingPayments]);

    const processingAmount = useMemo(() => {
        return pendingPayments
            .filter((p) => p.payout_status === "in_payout")
            .reduce((sum, p) => sum + Number(p.net_amount), 0);
    }, [pendingPayments]);

    const disbursedAmount = useMemo(() => {
        return payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    }, [payouts]);

    return {
        loading,
        payouts,
        pendingPayments,
        error,
        isRefreshing,
        activeTab,
        setActiveTab,
        showInfoModal,
        setShowInfoModal,
        
        calculatedPendingTotal,
        processingAmount,
        disbursedAmount,
        
        handleRefresh,
        fetchPayouts,
    };
}