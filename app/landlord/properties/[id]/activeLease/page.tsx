"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";
import LeaseTable from "@/components/landlord/activeLease/LeaseTable";
import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import LeaseScorecards from "@/components/landlord/activeLease/LeaseScorecards";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import {
  LeaseCardSkeleton,
  ScoreCardSkeleton,
} from "@/components/Commons/SkeletonLoaders";

export default function PropertyLeasesPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    filteredLeases,
    stats,
    scorecards,
    search,
    setSearch,

    selectedLease,
    setSelectedLease,
    setupModalLease,
    setSetupModalLease,
    selectedKypLease,
    setSelectedKypLease,
    kypOpen,
    setKypOpen,

    isLoading,
    error,
    getStatus,
    handleEndLease,
  } = usePropertyLeases(String(id));

  const handlePrimaryAction = (lease: any) => {
    getStatus(lease) === "draft"
      ? setSetupModalLease(lease)
      : setSelectedLease(lease);
  };

  const handleExtendLease = (lease: any) => {
    router.push(
      `/pages/landlord/properties/${id}/activeLease/extend/${lease.lease_id}`,
    );
  };

  const handleAuthenticateLease = (lease: any) => {
    router.push(
      `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`,
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="px-4 md:px-6 pt-20 md:pt-6">
          {/* HEADER SKELETON */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
            </div>

            {/* ACTION BUTTONS SKELETON */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="h-12 sm:h-10 bg-gray-200 rounded-2xl sm:rounded-lg animate-pulse w-full sm:w-32" />
              <div className="h-12 sm:h-10 bg-gray-200 rounded-2xl sm:rounded-lg animate-pulse w-full sm:w-32" />
            </div>

            {/* SCORECARDS SKELETON */}
            <ScoreCardSkeleton count={3} />

            {/* SEARCH SKELETON */}
            <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md animate-pulse mb-4" />
          </div>

          {/* MOBILE CARDS SKELETON */}
          <div className="block md:hidden">
            <LeaseCardSkeleton count={4} />
          </div>

          {/* DESKTOP TABLE SKELETON */}
          <div className="hidden md:block">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    {[...Array(6)].map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...Array(5)].map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {[...Array(6)].map((_, colIdx) => (
                        <td key={colIdx} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Failed to load leases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="px-4 md:px-6 pt-20 md:pt-6">
        {/* HEADER */}
        <div className="mb-6">
          {/* Header title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Active Leases</h1>
              <p className="text-xs text-gray-600">
                {filteredLeases.length} records found
              </p>
            </div>
          </div>

          {/* 🔘 Action Buttons — BELOW header */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Go to Billing */}
                <button
                    onClick={() =>
                        router.push(`/pages/landlord/properties/${id}/billing`)
                    }
                    className="
      w-full
      px-3 py-3 sm:px-5 sm:py-3
      bg-gradient-to-r from-blue-600 to-emerald-600
      hover:from-blue-700 hover:to-emerald-700
      text-white text-sm sm:text-sm font-semibold
      rounded-xl sm:rounded-2xl
      shadow-md
      transition-all
      active:scale-95
    "
                >
                    Go to Billing
                </button>

                {/* View Payments */}
                <button
                    onClick={() =>
                        router.push(`/pages/landlord/properties/${id}/payments`)
                    }
                    className="
      w-full
      px-3 py-3 sm:px-5 sm:py-3
      bg-white
      border border-gray-300
      hover:bg-gray-50
      text-gray-800 text-sm sm:text-sm font-semibold
      rounded-xl sm:rounded-2xl
      shadow-sm
      transition-all
      active:scale-95
    "
                >
                    View Payments
                </button>
            </div>

          {/* Scorecards */}
          <LeaseScorecards
            total={stats?.total_leases || 0}
            delta={stats?.total_leases_change || 0}
            deltaPct={stats?.total_leases_change_pct || 0}
            active={scorecards.active}
            expiringSoon={scorecards.expiringSoon}
            pendingSignatures={scorecards.pendingSignatures}
          />

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit, tenant, email, status…"
            className="w-full max-w-md px-4 py-2 text-sm border rounded-lg"
          />
        </div>

        <LeaseStack
          leases={filteredLeases}
          onPrimary={handlePrimaryAction}
          onExtend={handleExtendLease}
          onEnd={handleEndLease}
          onKyp={(l) => {
            setSelectedKypLease(l);
            setKypOpen(true);
          }}
        />

        <LeaseTable
          leases={filteredLeases}
          onPrimary={handlePrimaryAction}
          onExtend={handleExtendLease}
          onAuthenticate={handleAuthenticateLease}
          onEnd={handleEndLease}
          onKyp={(l) => {
            setSelectedKypLease(l);
            setKypOpen(true);
          }}
        />

        {selectedLease && (
          <LeaseDetailsPanel
            lease={selectedLease}
            onClose={() => setSelectedLease(null)}
          />
        )}

        {setupModalLease && (
          <ChecklistSetupModal
            lease={setupModalLease}
            agreement_id={setupModalLease.agreement_id}
            onClose={() => setSetupModalLease(null)}
            onContinue={() => {
              router.push(
                `/pages/landlord/properties/${id}/activeLease/initialSetup/${setupModalLease?.lease_id}`,
              );
              setSetupModalLease(null);
            }}
          />
        )}

        <EKypModal
          open={kypOpen}
          lease={selectedKypLease}
          onClose={() => {
            setKypOpen(false);
            setSelectedKypLease(null);
          }}
        />
      </div>
    </div>
  );
}
