"use client";

import { useRouter } from "next/navigation";
import {
    HomeIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";

import { useMyUnits } from "@/hooks/tenant/useMyUnits";

import UnitCard from "@/components/tenant/currentRent/unitCard/activeRentCards";
import SearchAndFilter from "@/components/Commons/SearchAndFilterUnits";
import Pagination from "@/components/Commons/Pagination";
import EmptyState from "@/components/Commons/EmptyStateUnitSearch";
import RenewalRequestForm from "@/components/tenant/currentRent/RenewalRequestForm";
import ScanUnitModal from "@/components/landlord/properties/units/ScanUnitModal";

export default function MyUnit() {
    const router = useRouter();
    const {
        user,
        units,
        loading,
        error,
        currentPage,
        searchQuery,
        setSearchQuery,
        filteredUnits,
        paginatedUnits,
        totalPages,
        isRefetching,
        showRenewalForm,
        setShowRenewalForm,
        loadingRenewal,
        isScanOpen,
        setIsScanOpen,
        handlePageChange,
        handleRefresh,
        handleContactLandlord,
        handleEndLease,
    } = useMyUnits();

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
                        onClick={() => router.push("/tenant/viewInvites")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm"
                    >
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Invitations</span>
                    </button>
                </div>
            </header>

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
                                        onContactLandlord={() => handleContactLandlord(unit)}
                                        onEndContract={handleEndLease}
                                        onAccessPortal={(id) =>
                                            router.push(
                                                `/tenant/rentalPortal/${id}`
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
                                    itemsPerPage={9}
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