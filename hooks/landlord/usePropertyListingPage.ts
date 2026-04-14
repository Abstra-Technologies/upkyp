"use client";
// use cases:
import { useEffect, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

export default function usePropertyListingPage() {
    const router = useRouter();

    const { fetchSession, user } = useAuthStore();
    const { properties, fetchAllProperties, loading, error } =
        usePropertyStore();

    const { subscription, loadingSubscription } = useSubscription(
        user?.landlord_id
    );

    /* ================= STATE ================= */

    const [verificationStatus, setVerificationStatus] =
        useState<string>("not verified");
    const [isFetchingVerification, setIsFetchingVerification] =
        useState<boolean>(true);
    const [isNavigating, setIsNavigating] =
        useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    const itemsPerPage = 9;

    /* ================= SESSION ================= */

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ================= PROPERTIES ================= */

    useEffect(() => {
        if (user?.landlord_id) {
            fetchAllProperties(user.landlord_id);
        }
    }, [user?.landlord_id, fetchAllProperties]);

    /* ================= VERIFICATION ================= */

    useEffect(() => {
        if (!user?.landlord_id) return;

        setIsFetchingVerification(true);

        axios
            .get(`/api/landlord/${user.landlord_id}/profileStatus`)
            .then((res) => {
                const status = res.data?.status;
                setVerificationStatus(
                    status === "verified" ? "approved" : "not verified"
                );
            })
            .catch(() => {
                setVerificationStatus("not verified");
            })
            .finally(() => {
                setIsFetchingVerification(false);
            });
    }, [user?.landlord_id]);

    /* ================= DERIVED ================= */

    const totalPropertyCount = properties.length;

    // ✅ NEW SOURCE OF TRUTH
    const maxProperties =
        subscription?.limits?.maxProperties ?? null;

    // null = unlimited
    const hasReachedLimit =
        subscription?.is_active === 1 &&
        maxProperties !== null &&
        totalPropertyCount >= maxProperties;

    /* ================= FILTERING ================= */

    const filteredProperties = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return properties.filter(
            (p: any) =>
                p.property_name?.toLowerCase().includes(q) ||
                p.address?.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q)
        );
    }, [properties, searchQuery]);

    /* ================= ACTIONS ================= */

    const handleView = useCallback(
        async (property: any, event: React.MouseEvent) => {
            event.stopPropagation();

            router.push(
                `/landlord/properties/${property.property_id}`
            );
        },
        [router]
    );

    const handleEdit = useCallback(
        (propertyId: string | number, event: React.MouseEvent) => {
            event.stopPropagation();
            router.push(
                `/landlord/properties/${propertyId}/editPropertyDetails`
            );
        },
        [router]
    );

    const handleAddProperty = useCallback(() => {
        // if (verificationStatus !== "approved") {
        //     Swal.fire(
        //         "Verification Required",
        //         "Please verify your profile first.",
        //         "warning"
        //     );
        //     return;
        // }
        //
        if (!subscription || subscription.is_active !== 1) {
            Swal.fire({
                title: "Join Our Beta Program",
                text: "Property publishing is currently available through our Beta Program.",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Join Beta",
                cancelButtonText: "Maybe Later",
                confirmButtonColor: "#2563eb",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push("/pages/landlord/beta-program/joinForm");
                }
            });

            return;
        }
        //
        // if (hasReachedLimit) {
        //     Swal.fire(
        //         "Limit Reached",
        //         `You've reached your plan limit of ${
        //             maxProperties ?? "∞"
        //         } properties.`,
        //         "error"
        //     );
        //     return;
        // }

        setIsNavigating(true);
        router.push(
            "/pages/landlord/property-listing/create-property"
        );
    }, [
        verificationStatus,
        subscription,
        hasReachedLimit,
        maxProperties,
        router,
    ]);

    const handleDelete = useCallback(
        async (propertyId: string | number, event: React.MouseEvent) => {
            event.stopPropagation();

            const confirm = await Swal.fire({
                title: "Are you sure?",
                icon: "warning",
                showCancelButton: true,
            });

            if (!confirm.isConfirmed) return;

            const res = await fetch(
                `/api/propertyListing/deletePropertyListing/${propertyId}`,
                { method: "DELETE" }
            );

            if (res.ok && user?.landlord_id) {
                fetchAllProperties(user.landlord_id);
            }
        },
        [fetchAllProperties, user?.landlord_id]
    );

    /* ================= UI FLAGS ================= */

    // const isAddDisabled =
    //     isFetchingVerification ||
    //     loadingSubscription ||
    //     isNavigating ||
    //     !subscription ||
    //     subscription.is_active !== 1 ||
    //     verificationStatus !== "approved" ||
    //     hasReachedLimit;

    /* ================= RETURN ================= */

    return {
        user,
        subscription,

        properties,
        filteredProperties,
        totalPropertyCount,
        maxProperties,

        verificationStatus,
        isFetchingVerification,

        loading,
        error,

        hasReachedLimit,
        // isAddDisabled,

        page,
        setPage,
        searchQuery,
        setSearchQuery,

        handleView,
        handleEdit,
        handleAddProperty,
        handleDelete,

        itemsPerPage,
    };
}
