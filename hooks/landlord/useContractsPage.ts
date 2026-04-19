/**
 * useContractsPage Hook
 * 
 * Used by: app/landlord/contracts/page.tsx
 * 
 * Provides functionality for the lease contracts page.
 * - Fetches leases and renewal requests
 * - Handles pagination
 * - Manages renewal request approvals/rejections
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import useAuthStore from "@/zustand/authStore";

type Contact = {
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    property_name: string;
    unit_name: string;
    lease_status: string;
    agreement_id: number;
    agreement_url: string;
};

type RenewalRequest = {
    id: number;
    tenant_name: string;
    unit_name: string;
    property_name?: string;
    requested_start_date: string;
    requested_end_date: string;
    status: string;
};

export function useContractsPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [leases, setLeases] = useState<Contact[]>([]);
    const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = useCallback(async () => {
        if (!user?.landlord_id) return;

        try {
            const [leasesRes, renewRes] = await Promise.all([
                fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${user.landlord_id}`),
                fetch(`/api/landlord/properties/getRenewalRequest?landlord_id=${user.landlord_id}`)
            ]);
            setLeases(await leasesRes.json());
            setRenewals(await renewRes.json());
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.landlord_id]);

    useEffect(() => {
        if (user?.landlord_id) {
            fetchData();
        }
    }, [user?.landlord_id, fetchData]);

    const refreshRenewals = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/landlord/properties/getRenewalRequest?landlord_id=${user?.landlord_id}`);
            const data = await res.json();
            setRenewals(data);
        } catch (err) {
            console.error("Failed to refresh renewal requests:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.landlord_id]);

    const handleView = useCallback((id: number) => {
        router.push(`/lease/${id}`);
    }, [router]);

    const handleApproveRenewal = useCallback(async (reqId: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/leaseAgreement/updateRenewalStatus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: reqId, status: "approved" }),
            });
            if (!res.ok) throw new Error("Failed to approve request");

            setRenewals((prev) => prev.filter((r) => r.id !== reqId));
        } catch (err) {
            console.error(err);
            alert("Error approving renewal");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRejectRenewal = useCallback(async (reqId: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/leaseAgreement/updateRenewalStatus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: reqId, status: "declined" }),
            });
            if (!res.ok) throw new Error("Failed to reject request");

            setRenewals((prev) => prev.filter((r) => r.id !== reqId));
        } catch (err) {
            console.error(err);
            alert("Error rejecting renewal");
        } finally {
            setLoading(false);
        }
    }, []);

    const pendingRenewals = useMemo(() => {
        return renewals.filter((req) => req.status === "pending");
    }, [renewals]);

    const start = (page - 1) * itemsPerPage;
    const visibleLeases = leases.slice(start, start + itemsPerPage);

    return {
        loading,
        leases,
        renewals,
        pendingRenewals,
        visibleLeases,
        page,
        setPage,
        itemsPerPage,
        
        refreshRenewals,
        handleView,
        handleApproveRenewal,
        handleRejectRenewal,
    };
}