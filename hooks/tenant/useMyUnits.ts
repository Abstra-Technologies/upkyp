"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import useSWR from "swr";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import { Unit } from "@/types/units";
import { decryptData } from "@/crypto/encrypt";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const shouldRemoveFromView = (unit: Unit) => {
    if (unit.leaseSignature !== "completed" || !unit.lease_ended_at) {
        return false;
    }
    return (
        Date.now() - new Date(unit.lease_ended_at).getTime() >
        THREE_DAYS_MS
    );
};

const sortActiveFirst = (a: Unit, b: Unit) => {
    if (a.leaseSignature === "active" && b.leaseSignature !== "active") {
        return -1;
    }
    if (a.leaseSignature !== "active" && b.leaseSignature === "active") {
        return 1;
    }
    return 0;
};

export function useMyUnits() {
    const router = useRouter();
    const { user, admin, fetchSession } = useAuthStore();

    const [isScanOpen, setIsScanOpen] = useState(false);
    const [showRenewalForm, setShowRenewalForm] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefetching, setIsRefetching] = useState(false);
    const [loadingRenewal, setLoadingRenewal] = useState(false);

    const itemsPerPage = 9;

    const {
        data: unitsData,
        error,
        isLoading: loading,
        mutate,
    } = useSWR<any>(
        user?.tenant_id
            ? `/api/tenant/activeRent?tenantId=${user.tenant_id}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    const units = useMemo(() => unitsData ?? [], [unitsData]);

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin, fetchSession]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const { filteredUnits, paginatedUnits, totalPages, hasActiveLease } = useMemo(() => {
        const filtered = units
            .filter((unit) => !shouldRemoveFromView(unit))
            .filter((unit) => {
                const q = searchQuery.toLowerCase();
                return (
                    unit.unit_name.toLowerCase().includes(q) ||
                    unit.property_name.toLowerCase().includes(q) ||
                    unit.city.toLowerCase().includes(q) ||
                    unit.province.toLowerCase().includes(q)
                );
            })
            .sort(sortActiveFirst);

        const hasActiveLease = filtered.some((unit) => unit.leaseSignature === "active");
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;

        return {
            filteredUnits: filtered,
            paginatedUnits: filtered.slice(startIndex, startIndex + itemsPerPage),
            totalPages,
            hasActiveLease,
        };
    }, [units, searchQuery, currentPage]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true);
        await mutate();
        setIsRefetching(false);
    }, [mutate]);

    const handleContactLandlord = useCallback((unit: Unit) => {
        if (!unit || !user) return;

        let landlordName = unit.landlord_name || "Landlord";

        try {
            if (landlordName.startsWith("{") || landlordName.startsWith("[")) {
                landlordName = decryptData(
                    JSON.parse(landlordName),
                    process.env.ENCRYPTION_SECRET
                );
            }
        } catch {}

        useChatStore.getState().setPreselectedChat({
            chat_room: `chat_${[user.user_id, unit.landlord_user_id]
                .sort()
                .join("_")}`,
            landlord_id: unit.landlord_id,
            tenant_id: user.tenant_id,
            name: landlordName,
        });

        router.push("/tenant/chat");
    }, [user, router]);

    const handleEndLease = useCallback(async (unitId: string, agreementId: string) => {
        if (!user?.tenant_id) {
            Swal.fire("Unauthorized", "Please log in first.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "End Lease Agreement?",
            text: "This action cannot be undone. Your landlord will be notified.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, End Lease",
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch("/api/tenant/activeRent/endLease", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: user.tenant_id,
                    agreement_id: agreementId,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Lease Ended Successfully",
                    text: data.message || "Your landlord has been notified.",
                    confirmButtonText: "Continue",
                    confirmButtonColor: "#10B981",
                });

                mutate(
                    (prev) =>
                        prev?.filter((u) => u.unit_id !== unitId) ?? [],
                    false
                );

                router.push(`/tenant/feedback?agreement_id=${agreementId}`);
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Unable to End Lease",
                    text: data.error || "Please settle all pending payments before ending your lease.",
                    confirmButtonColor: "#d33",
                });
            }
        } catch (err) {
            console.error("Error ending lease:", err);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong. Please try again later.",
            });
        }
    }, [user?.tenant_id, router, mutate]);

    return {
        user,
        admin,
        units,
        loading,
        error,
        mutateUnits: mutate,
        currentPage,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        filteredUnits,
        paginatedUnits,
        totalPages,
        hasActiveLease,
        itemsPerPage,
        isRefetching,
        loadingRenewal,
        showRenewalForm,
        setShowRenewalForm,
        isScanOpen,
        setIsScanOpen,
        handlePageChange,
        handleRefresh,
        handleContactLandlord,
        handleEndLease,
    };
}