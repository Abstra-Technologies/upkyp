"use client";

import React from "react";
import { Home, Plus, Sparkles, Search, QrCode, HelpCircle, FileSpreadsheet, Users, CreditCard, ScrollText, ReceiptText, ChevronRight } from "lucide-react";
import { Pagination } from "@mui/material";
import Swal from "sweetalert2";
import Link from "next/link";
import useSWR from "swr";

import useSubscription from "@/hooks/landlord/subscription/useSubscription";
import UnitLimitsCard from "@/components/landlord/subscriptions-limitations/UnitLimitsCard";
import useAuthStore from "@/zustand/authStore";

import UnitsTab from "@/components/landlord/properties/UnitsTab";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";
import AddUnitModal from "@/components/landlord/properties/AddUnitModal";

import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";
import { useOnboarding } from "@/hooks/useOnboarding";
import { propertyUnitsTourSteps } from "@/lib/onboarding/propertyUnitsTourSteps";
import { propertyUnitsTourStepsMobile } from "@/lib/onboarding/propertyUnitsTourStepsMobile";
import axios from "axios";
import { mutate } from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ViewPropertyDetailedPage() {
  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const { subscription, loadingSubscription } = useSubscription(landlordId);

  const {
    property_id,
    error,
    isLoading,

    page,
    setPage,
    itemsPerPage,
    units,

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
  } = usePropertyUnitsPage();

  const { data: verificationData } = useSWR(
    property_id ? `/api/landlord/properties/docs/${property_id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const verificationStatus = verificationData?.[0]?.status || null;

  const currentUnitsCount = units.length;
  const maxUnits = subscription?.limits?.maxUnits ?? null;

  const reachedUnitLimit = maxUnits !== null && currentUnitsCount >= maxUnits;

  const unitActionsDisabled =
    loadingSubscription || !subscription || reachedUnitLimit;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const { startTour } = useOnboarding({
    tourId: "property_units",
    steps: isMobile ? propertyUnitsTourStepsMobile : propertyUnitsTourSteps,
    autoStart: true,
    config: {
      allowClose: false,
      showEndTourButton: true,
    },
  });

  const handleGenerateQRCodes = async () => {
    if (!units.length) {
      Swal.fire(
        "No Units",
        "There are no units available to generate QR codes.",
        "info",
      );
      return;
    }

    try {
      Swal.fire({
        title: "Generating QR Codes",
        text: "Please wait while we prepare your QR codes…",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await axios.post(
        "/api/landlord/unit/qr-code/generate",
        { property_id },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `unit-qr-codes-${property_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.close();
      await Swal.fire("Done", "QR codes generated successfully.", "success");
    } catch (err) {
      Swal.close();
      Swal.fire(
        "Error",
        "Failed to generate QR codes. Please try again.",
        "error",
      );
    }
  };

  if (error) {
    return (
      <ErrorBoundary
        error="Failed to load units. Please try again later."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-none bg-gray-50 pb-24 md:pb-6 overflow-x-hidden">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* ================= HEADER ================= */}
        <div id="units-header" className="mb-6">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Unit Overview
                </h1>
              </div>
            </div>

            <button
              onClick={startTour}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shrink-0 shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Guide
            </button>
          </div>

          {/* Quick Action Buttons */}
            <div
                id="units-action-buttons"
                className="grid grid-cols-4 md:grid-cols-4 text-center gap-2.5 mb-4"
            >
            {/* Add Unit */}
            <button
              onClick={handleAddUnitClick}
              disabled={unitActionsDisabled}
              className={`group relative overflow-hidden rounded-xl p-3 md:p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-center justify-center gap-2 ${
                unitActionsDisabled
                  ? "bg-gray-100 border border-gray-200 opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${unitActionsDisabled ? "bg-gray-200" : "bg-white/20"}`}>
                <Plus className={`w-5 h-5 ${unitActionsDisabled ? "text-gray-400" : "text-white"}`} />
              </div>
              <span className={`text-xs font-bold ${unitActionsDisabled ? "text-gray-500" : "text-white"}`}>Add Unit</span>
              {unitActionsDisabled && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/50" />
              )}
            </button>

            {/* Invite Tenant */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="group relative overflow-hidden rounded-xl p-3 md:p-4 bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-white">Invite Tenant</span>
            </button>

            {/* Active Lease */}
            <Link
              href={`/landlord/properties/${property_id}/activeLease`}
              className="group relative overflow-hidden rounded-xl p-3 md:p-4 bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-white">Active Leases</span>
            </Link>

            {/* Utility Cost */}
            <Link
              href={`/landlord/properties/${property_id}/utilities`}
              className="group relative overflow-hidden rounded-xl p-3 md:p-4 bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-white">Utility Costs</span>
            </Link>
          </div>

          {/* SEARCH */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* ================= UNIT LIMITS ================= */}
        {!loadingSubscription && (
          <div className="mb-4 max-w-xl">
            <UnitLimitsCard
              subscription={subscription}
              currentUnitsCount={currentUnitsCount}
            />
          </div>
        )}

        {/* ================= UNITS LIST ================= */}
        <div
          id="units-list"
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <UnitsTab
            units={currentUnits}
            isLoading={isLoading}
            propertyId={property_id}
            propertyVerificationStatus={verificationStatus}
            handleEditUnit={handleEditUnit}
            handleDeleteUnit={handleDeleteUnit}
            handleAddUnitClick={handleAddUnitClick}
            onPublishToggle={(unitId, publish) => {
              mutate(
                `/api/unitListing/getUnitListings?property_id=${property_id}`,
                (prev: any[]) =>
                  prev.map((u) =>
                    u.unit_id === unitId ? { ...u, publish } : u,
                  ),
                false,
              );
            }}
          />

          {filteredUnits.length > itemsPerPage && (
            <div className="flex justify-center p-4 border-t border-gray-100">
              <Pagination
                count={Math.ceil(filteredUnits.length / itemsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {isAIGeneratorOpen && (
        <AIUnitGenerator
          propertyId={property_id}
          onClose={() => setIsAIGeneratorOpen(false)}
        />
      )}

      {inviteModalOpen && (
        <InviteTenantModal
          propertyId={property_id}
          onClose={() => setInviteModalOpen(false)}
        />
      )}

      {bulkImportModal && (
        <BulkImportUnitModal
          isOpen={bulkImportModal}
          onClose={() => setBulkImportModal(false)}
          propertyId={property_id}
        />
      )}

      {addUnitModalOpen && property_id && (
        <AddUnitModal
          property_id={property_id}
          landlord_id={landlordId || ""}
          onClose={() => setAddUnitModalOpen(false)}
        />
      )}
    </div>
  );
}
