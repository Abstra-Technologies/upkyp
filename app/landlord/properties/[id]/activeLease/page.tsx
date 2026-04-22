"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import { FileText, ReceiptText, HelpCircle, AlertTriangle, Banknote, Clock, Gauge, Download } from "lucide-react";

import LeaseTable from "@/components/landlord/activeLease/LeaseTable";
import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import ChecklistModal from "@/components/landlord/activeLease/ChecklistModal";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import {
  LeaseCardSkeleton,
} from "@/components/Commons/SkeletonLoaders";

/* 🔹 Billing imports */
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import UnitMeterReadingsModal from "@/components/landlord/unitBilling/UnitMeterReadingsModal";
import PropertyBulkMeterReadingModal from "@/components/landlord/activeLease/PropertyBulkMeterReadingModal";
import { usePropertyBilling } from "@/hooks/landlord/billing/usePropertyBilling";
import ConfigRequiredModal from "@/components/landlord/property-billing/ConfigRequiredModal";
import BillingRateStatus from "@/components/landlord/property-billing/BillingRateStatus";
import BillingUnitListMobile from "@/components/landlord/property-billing/BillingUnitListMobile";
import BillingUnitTableDesktop from "@/components/landlord/property-billing/BillingUnitTableDesktop";
import BillingSkeleton from "@/components/landlord/property-billing/BillingSkeleton";

export default function PropertyLeasesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mode, setMode] = useState<"lease" | "billing">("lease");

  /* ================= LEASE HOOK ================= */
  const {
    filteredLeases,
    search,
    setSearch,

    selectedKypLease,
    setSelectedKypLease,
    kypOpen,
    setKypOpen,

    isLoading,
    error,
    getStatus,
    handleEndLease,
  } = usePropertyLeases(String(id));

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [bulkMeterOpen, setBulkMeterOpen] = useState(false);

  /* ================= BILLING HOOK ================= */
  const billing = usePropertyBilling(String(id));

  const handlePrimaryAction = (lease: any) => {
    if (!lease) return;
    
    const agreementId = lease.agreement_id || lease.lease_id;
    const status = (lease.status ?? lease.lease_status)?.toLowerCase();
    
    if (status === "draft" && agreementId) {
      setSelectedLease(lease);
      setChecklistOpen(true);
    } else if (agreementId) {
      router.push(
        `/landlord/properties/${id}/activeLease/leaseDetails/${agreementId}`
      );
    }
  };

  const handleChecklistContinue = (data: any) => {
    setChecklistOpen(false);
    router.push(
      `/landlord/properties/${id}/activeLease/initialSetup/${selectedLease?.agreement_id || selectedLease?.lease_id}`
    );
  };

  const handleExtendLease = (lease: any) => {
    router.push(
      `/landlord/properties/${id}/activeLease/extend/${lease.lease_id}`,
    );
  };

  const handleAuthenticateLease = (lease: any) => {
    router.push(
      `/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`,
    );
  };

  const billingBlocked =
    billing.configMissing || billing.payoutMissing;

  /* ================= LEASE LOADING ================= */
  if (mode === "lease" && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="px-4 md:px-6 pt-20 md:pt-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="h-12 sm:h-10 bg-gray-200 rounded-2xl sm:rounded-lg animate-pulse w-full sm:w-32" />
              <div className="h-12 sm:h-10 bg-gray-200 rounded-2xl sm:rounded-lg animate-pulse w-full sm:w-32" />
            </div>

            <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md animate-pulse mb-4" />
          </div>

          <div className="block md:hidden">
            <LeaseCardSkeleton count={4} />
          </div>

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

  /* ================= BILLING LOADING ================= */
  if (mode === "billing" && billing.isInitialLoad) {
    return <BillingSkeleton />;
  }

  /* ================= LEASE ERROR ================= */
  if (mode === "lease" && error) {
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
        {/* ================= MODE TOGGLE ================= */}
        <div className="mb-6">
          <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setMode("lease")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "lease"
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              Active Leases
            </button>
            <button
              onClick={() => setMode("billing")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "billing"
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              Billing
            </button>
          </div>
        </div>

        {/* ================= LEASE MODE ================= */}
        {mode === "lease" && (
          <div>
            {/* HEADER */}
            <div className="mb-6">
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

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setMode("billing")}
                  className="w-full px-3 py-3 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-sm sm:text-sm font-semibold rounded-xl sm:rounded-2xl shadow-md transition-all active:scale-95"
                >
                  Go to Billing
                </button>

                <button
                  onClick={() =>
                    router.push(`/landlord/properties/${id}/payments`)
                  }
                  className="w-full px-3 py-3 sm:px-5 sm:py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm sm:text-sm font-semibold rounded-xl sm:rounded-2xl shadow-sm transition-all active:scale-95"
                >
                  View Payments
                </button>
              </div>

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

            <EKypModal
              open={kypOpen}
              lease={selectedKypLease}
              onClose={() => {
                setKypOpen(false);
                setSelectedKypLease(null);
              }}
            />

            <ChecklistModal
              open={checklistOpen && !!selectedLease}
              lease={selectedLease}
              onClose={() => {
                setChecklistOpen(false);
                setSelectedLease(null);
              }}
              onContinue={handleChecklistContinue}
            />
          </div>
        )}

        {/* ================= BILLING MODE ================= */}
        {mode === "billing" && (
          <div className="w-full px-0 md:px-0">
            {/* CONFIG MODAL */}
            <ConfigRequiredModal
              configModal={billing.configModal}
              setConfigModal={billing.setConfigModal}
              router={billing.router}
              property_id={billing.property_id}
            />

            {/* HEADER */}
            <div className="mb-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                      Billing for{" "}
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h1>
                  </div>
                </div>

                <button
                  onClick={billing.startTour}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Show Guide</span>
                </button>
              </div>

              {/* 3-COLUMN ROW: Summary + Rate Setter + Bulk Meter */}
              {!billingBlocked && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Col 1: Total Collected */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500">Collected</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">
                      ₱{billing.bills
                        .filter((b: any) => b.billing_status?.toLowerCase() === "paid")
                        .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                        .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() === "paid").length} paid
                    </p>
                  </div>

                  {/* Col 2: Total Pending */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-amber-600">
                      ₱{billing.bills
                        .filter((b: any) => b.billing_status?.toLowerCase() !== "paid")
                        .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                        .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() !== "paid").length} pending
                    </p>
                  </div>

                  {/* Col 3: Rate Setter + Bulk Meter */}
                  <div className="space-y-2">
                    <BillingRateStatus
                      propertyDetails={billing.propertyDetails}
                      hasBillingForMonth={billing.hasBillingForMonth}
                      billingData={billing.billingData}
                      setIsModalOpen={billing.setIsModalOpen}
                    />

                    {(billing.propertyDetails?.water_billing_type === "submetered" ||
                      billing.propertyDetails?.electricity_billing_type === "submetered") && (
                      <button
                        disabled={billing.configMissing}
                        onClick={() => !billing.configMissing && setBulkMeterOpen(true)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs shadow-sm ${
                          billing.configMissing
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        }`}
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        Bulk Meter
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ENTERPRISE VALIDATION CARD */}
              {billing.payoutMissing && (
                <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">
                        Payout Account Required
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        You must set a default payout account before issuing billing.
                        This ensures rent payments can be transferred to your bank.
                      </p>

                      <button
                        onClick={() =>
                          billing.router.push(
                            "/landlord/settings/payout"
                          )
                        }
                        className="mt-3 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      >
                        Set Up Payout Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUMMARY DOWNLOAD */}
              {!billingBlocked && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                  <button
                    disabled={billing.configMissing}
                    onClick={() =>
                      billing.configMissing
                        ? Swal.fire(
                            "Configuration Required",
                            "Please complete property configuration first.",
                            "warning",
                          )
                        : billing.handleDownloadSummary()
                    }
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm ${
                      billing.configMissing
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download Summary
                  </button>
                </div>
              )}
            </div>

            {/* MODALS & BILLING LIST */}
            {!billingBlocked && (
              <>
                <PropertyRatesModal
                  isOpen={billing.isModalOpen}
                  onClose={() => billing.setIsModalOpen(false)}
                  billingData={billing.billingData}
                  billingForm={billing.billingForm}
                  propertyDetails={billing.propertyDetails}
                  hasBillingForMonth={billing.hasBillingForMonth}
                  handleInputChange={billing.handleInputChange}
                  handleSaveorUpdateRates={billing.handleSaveorUpdateRates}
                  onBillingUpdated={(updated) => {
                    billing.setBillingData(updated);
                    billing.setHasBillingForMonth(true);
                  }}
                />

                <UnitMeterReadingsModal
                  isOpen={billing.openMeterList}
                  onClose={() => billing.setOpenMeterList(false)}
                  property_id={billing.property_id}
                />

                <PropertyBulkMeterReadingModal
                  isOpen={bulkMeterOpen}
                  onClose={() => setBulkMeterOpen(false)}
                  property_id={String(id)}
                />

                <BillingUnitListMobile
                  bills={billing.bills}
                  loadingBills={billing.loadingBills}
                  propertyDetails={billing.propertyDetails}
                  router={billing.router}
                  property_id={billing.property_id}
                  guardActionWithConfig={billing.guardBillingAction}
                  getStatusConfig={billing.getStatusConfig}
                />

                <BillingUnitTableDesktop
                  bills={billing.bills}
                  loadingBills={billing.loadingBills}
                  propertyDetails={billing.propertyDetails}
                  router={billing.router}
                  property_id={billing.property_id}
                  guardActionWithConfig={billing.guardBillingAction}
                  getStatusConfig={billing.getStatusConfig}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
