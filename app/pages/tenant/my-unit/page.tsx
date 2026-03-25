"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
    HomeIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import useSWR from "swr";

// Components
import UnitCard from "@/components/tenant/currentRent/unitCard/activeRentCards";
import SearchAndFilter from "@/components/Commons/SearchAndFilterUnits";
import Pagination from "@/components/Commons/Pagination";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import EmptyState from "@/components/Commons/EmptyStateUnitSearch";
import RenewalRequestForm from "@/components/tenant/currentRent/RenewalRequestForm";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import ScanUnitModal from "@/components/landlord/properties/units/ScanUnitModal";

// Types & utils
import { Unit } from "@/types/units";
import { decryptData } from "@/crypto/encrypt";

/* =====================================================
   CONSTANTS
===================================================== */
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/* =====================================================
   HELPERS
===================================================== */
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

/* =====================================================
    FETCH UNIT DATA
===================================================== */
const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

const useUnits = (tenantId?: string) => {
    const {
        data,
        error,
        isLoading,
        mutate,
    } = useSWR<any>(
        tenantId
            ? `/api/tenant/activeRent?tenantId=${tenantId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        units: data ?? [],
        loading: isLoading,
        error,
        mutateUnits: mutate,
    };
};
/* =====================================================
   PAGE
===================================================== */
export default function MyUnit() {
    // @ts-ignore
    const { user, admin, fetchSession } = useAuthStore();
    const router = useRouter();
    const [isScanOpen, setIsScanOpen] = useState(false);

    const [showRenewalForm, setShowRenewalForm] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefetching, setIsRefetching] = useState(false);
    const [loadingRenewal, setLoadingRenewal] = useState(false);

    const itemsPerPage = 9;
    const {
        units,
        loading,
        error,
        mutateUnits,
    } = useUnits(user?.tenant_id || undefined);


    /* SESSION */
    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin, fetchSession]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    /* FILTER + SORT + PAGINATION */
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
            .sort(sortActiveFirst); // ⭐ ACTIVE UNITS FIRST

        const hasActiveLease = filtered.some((unit) => unit.leaseSignature === "active");
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;

        return {
            filteredUnits: filtered,
            paginatedUnits: filtered.slice(
                startIndex,
                startIndex + itemsPerPage
            ),
            totalPages,
            hasActiveLease,
        };
    }, [units, searchQuery, currentPage]);

    /* ACTIONS */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRefresh = async () => {
        setIsRefetching(true);
        await mutateUnits();
        setIsRefetching(false);
    };


    const handleContactLandlord = () => {
        const unit = units[0];
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

        router.push("/pages/tenant/chat");
    };

    const handleEndLease = useCallback(
        async (unitId: string, agreementId: string) => {
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

                    mutateUnits(
                        (prev) =>
                            prev?.filter((u) => u.unit_id !== unitId) ?? [],
                        false
                    );


                    router.push(`/pages/tenant/feedback?agreement_id=${agreementId}`);
                } else {
                    await Swal.fire({
                        icon: "error",
                        title: "Unable to End Lease",
                        text:
                            data.error ||
                            "Please settle all pending payments before ending your lease.",
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
        },
        [user?.tenant_id, router]
    );

    /* LOADING (UNCHANGED SKELETON) */
    if (loading) {
        return (
            <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                        <div>
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>

                <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-200 p-4"
                        >
                            <div className="h-48 bg-gray-200 rounded-lg animate-pulse mb-4" />
                            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4" />
                            <div className="flex gap-2">
                                <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            {/* HEADER */}
            <header className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                        <HomeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            My Units
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600">
                            Manage your active rentals
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefetching}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-sm disabled:opacity-50"
                    >
                        <ArrowPathIcon
                            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        onClick={() => setIsScanOpen(true)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2
                   bg-gradient-to-r from-indigo-600 to-blue-600
                   text-white rounded-lg font-semibold text-sm
                   hover:from-indigo-700 hover:to-blue-700"
                    >
                        <QrCodeIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Scan QR</span>
                    </button>

                    <button
                        onClick={() => router.push("/pages/tenant/viewInvites")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm"
                    >
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Invitations</span>
                    </button>
                </div>
            </header>

            {/* {error && <ErrorBoundary error={error} onRetry={handleRefresh} />} */}

            {!error && (
                <>
                    {units.length > 0 && (
                        <SearchAndFilter
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            totalUnits={units.length}
                            filteredCount={filteredUnits.length}
                        />
                    )}

                    {/* NO ACTIVE LEASE STATE */}
                    {/*{((!hasActiveLease && units.length > 0 && !searchQuery) || (units.length === 0 && !loading && !searchQuery)) && (*/}
                    {/*    <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-8 mb-6">*/}
                    {/*        <div className="flex flex-col sm:flex-row items-center gap-6">*/}
                    {/*            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center shrink-0">*/}
                    {/*                <DocumentTextIcon className="w-10 h-10 text-amber-600" />*/}
                    {/*            </div>*/}
                    {/*            <div className="text-center sm:text-left">*/}
                    {/*                <h3 className="text-lg font-bold text-amber-900 mb-1">*/}
                    {/*                    No Active Lease Found*/}
                    {/*                </h3>*/}
                    {/*                <p className="text-amber-700 text-sm mb-3">*/}
                    {/*                    You don't have any active leases at the moment. */}
                    {/*                    Browse available properties or accept an invitation to get started.*/}
                    {/*                </p>*/}
                    {/*                <div className="flex flex-wrap justify-center sm:justify-start gap-3">*/}
                    {/*                    <button*/}
                    {/*                        onClick={() => router.push("/pages/tenant/property-search")}*/}
                    {/*                        className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"*/}
                    {/*                    >*/}
                    {/*                        Browse Properties*/}
                    {/*                    </button>*/}
                    {/*                    <button*/}
                    {/*                        onClick={() => router.push("/pages/tenant/viewInvites")}*/}
                    {/*                        className="px-4 py-2 bg-white text-amber-700 border border-amber-300 rounded-lg font-semibold text-sm hover:bg-amber-50 transition-colors"*/}
                    {/*                    >*/}
                    {/*                        View Invitations*/}
                    {/*                    </button>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {filteredUnits.length === 0 ? (
                        <EmptyState
                            searchQuery={searchQuery}
                            onClearSearch={() => setSearchQuery("")}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-6">
                                {paginatedUnits.map((unit) => (
                                    <UnitCard
                                        key={unit.unit_id}
                                        unit={unit}
                                        onContactLandlord={handleContactLandlord}
                                        onEndContract={handleEndLease}
                                        onAccessPortal={(id) =>
                                            router.push(
                                                `/pages/tenant/rentalPortal/${id}`
                                            )
                                        }
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={filteredUnits.length}
                                    itemsPerPage={itemsPerPage}
                                />
                            )}
                        </>
                    )}

                    {showRenewalForm && (
                        <RenewalRequestForm
                            unit={
                                units.find((u) => u.unit_id === showRenewalForm)!
                            }
                            onSubmit={() => {}}
                            onClose={() => setShowRenewalForm(null)}
                            loading={loadingRenewal}
                        />
                    )}
                </>
            )}

            <ScanUnitModal
                isOpen={isScanOpen}
                onClose={() => setIsScanOpen(false)}
            />


        </div>

    );
}
