"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { usePropertyData } from "@/hooks/usePropertyData";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function usePropertyUnitsPage() {
    const router = useRouter();
    const params = useParams();

    const property_id =
        typeof params?.id === "string" ? params.id : null;

    const { user } = useAuthStore();

    /* ---------------- AUTH (SWR) ---------------- */

    useSWR(
        user ? null : "/api/auth/session",
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        }
    );

    const landlord_id = user?.landlord_id ?? null;

    /* ---------------- PROPERTY + UNITS ---------------- */

    const {
        subscription,
        units = [],
        error,
        isLoading,
    } = usePropertyData(property_id!, landlord_id);

    /* ---------------- STATE ---------------- */

    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [searchQuery, setSearchQuery] = useState("");

    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkImportModal, setBulkImportModal] = useState(false);
    const [addUnitModalOpen, setAddUnitModalOpen] = useState(false);

    /* ---------------- SEARCH ---------------- */

    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;

        const q = searchQuery.toLowerCase();

        return units.filter((unit: any) =>
            [
                unit.unit_name,
                unit.unit_style,
                unit.furnish,
                unit.amenities,
                unit.status,
            ]
                .filter(Boolean)
                .some((field) =>
                    String(field).toLowerCase().includes(q)
                )
        );
    }, [searchQuery, units]);

    /* ---------------- PAGINATION ---------------- */

    const startIndex = (page - 1) * itemsPerPage;
    const currentUnits = filteredUnits.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    /* ---------------- ACTIONS ---------------- */

    const handleAddUnitClick = () => {
        if (!subscription || subscription.is_active !== 1) {
            Swal.fire(
                "Subscription Required",
                "Please activate your subscription.",
                "info"
            );
            return;
        }

        if (units.length >= subscription.listingLimits?.maxUnits) {
            Swal.fire(
                "Limit Reached",
                "You’ve reached your unit limit.",
                "error"
            );
            return;
        }

        setAddUnitModalOpen(true);
    };

    const handleEditUnit = (unitId: number) => {
        router.push(
            `/landlord/properties/${property_id}/units/edit/${unitId}`
        );
    };

    const handleDeleteUnit = async (unitId: number) => {
        const confirm = await Swal.fire({
            title: "Delete unit?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        await axios.delete(`/api/unitListing/deleteUnit?id=${unitId}`);

        // 🔥 instant list update
        mutate(
            `/api/unitListing/getUnitListings?property_id=${property_id}`
        );
    };

    return {
        property_id,
        subscription,
        units,              // 👈 ADD THIS (source of truth)
        error,
        isLoading,

        page,
        setPage,
        itemsPerPage,

        searchQuery,
        setSearchQuery,

        filteredUnits,
        currentUnits,

        handleAddUnitClick,
        handleEditUnit,
        handleDeleteUnit,

        isAIGeneratorOpen,
        setIsAIGeneratorOpen,
        inviteModalOpen,
        setInviteModalOpen,
        bulkImportModal,
        setBulkImportModal,
        addUnitModalOpen,
        setAddUnitModalOpen,
    };

}
