"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function useActiveLease(propertyId: string) {
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [allDraftLeases, setAllDraftLeases] = useState<any[]>([]);

    const { data: leasesData, isLoading: loadingLeases, mutate: mutateLeases } = useSWR(
        propertyId
            ? `/api/landlord/activeLease/getByProperty?property_id=${propertyId}`
            : null,
        fetcher,
        { refreshInterval: 5000, revalidateOnFocus: false }
    );

    const leases = leasesData?.leases || [];

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const res = await fetch(`/api/landlord/activeLease/getByProperty?property_id=${propertyId}`);
                const data = await res.json();
                const drafts = (data.leases || []).filter((l: any) =>
                    (l.status ?? l.lease_status)?.toLowerCase() === "draft"
                );
                setAllDraftLeases(drafts);
            } catch (err) {
                console.error("Error fetching drafts:", err);
            }
        };
        if (propertyId) fetchDrafts();
    }, [propertyId]);

    const activeLeasesOnly = leases.filter((l: any) =>
        (l.status ?? l.lease_status)?.toLowerCase() !== "draft"
    );

    const filteredLeases = useMemo(() => {
        if (!search.trim()) return activeLeasesOnly;
        const q = search.toLowerCase();
        return activeLeasesOnly.filter((l: any) =>
            l.unit_name?.toLowerCase().includes(q) ||
            l.tenant_name?.toLowerCase().includes(q) ||
            l.tenant_email?.toLowerCase().includes(q) ||
            (l.status ?? l.lease_status)?.toLowerCase().includes(q)
        );
    }, [activeLeasesOnly, search]);

    const scorecards = {
        total: leases.length,
        active: activeLeasesOnly.length,
        expiringSoon: leases.filter((l: any) => {
            const status = (l.status ?? l.lease_status)?.toLowerCase();
            return status === "active" && l.end_date && new Date(l.end_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        }).length,
        occupancy: leases.length > 0 ? Math.round((activeLeasesOnly.length / leases.length) * 100) : 0,
    };

    const handleEndLease = async (lease: any) => {
        const result = await Swal.fire({
            title: "End Lease?",
            text: "This will permanently mark the lease as completed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, end lease",
            confirmButtonColor: "#d33",
        });
        if (!result.isConfirmed) return;

        try {
            Swal.fire({ title: "Ending lease...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            await axios.post("/api/landlord/activeLease/endLease", { agreement_id: lease.lease_id });
            Swal.fire("Success", "Lease completed.", "success");
            mutateLeases();
        } catch (err: any) {
            Swal.fire("Error", err?.response?.data?.message || "Something went wrong.", "error");
        }
    };

    const getStatusConfig = (status: string) => {
        const s = status?.toLowerCase();
        if (s === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s === "pending") return "bg-blue-50 text-blue-700 border-blue-200";
        if (s === "draft") return "bg-gray-50 text-gray-700 border-gray-200";
        if (s === "expired") return "bg-red-50 text-red-700 border-red-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    const getStatusLabel = (lease: any) => {
        const status = (lease.status ?? lease.lease_status)?.toLowerCase();
        const endDate = lease.end_date ? new Date(lease.end_date) : null;
        const isExpiringSoon = endDate && endDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        
        if (status === "active" && isExpiringSoon) return "Expiring Soon";
        return status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown";
    };

    return {
        router,
        leases,
        activeLeasesOnly,
        filteredLeases,
        allDraftLeases,
        loadingLeases,
        error: leasesData?.error,
        search,
        setSearch,
        scorecards,
        handleEndLease,
        mutateLeases,
        getStatusConfig,
        getStatusLabel,
    };
}
