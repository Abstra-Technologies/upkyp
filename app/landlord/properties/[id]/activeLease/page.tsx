"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, ReceiptText, AlertTriangle, Banknote, Clock, Gauge, Download, Settings } from "lucide-react";

import LeaseTable from "@/components/landlord/activeLease/LeaseTable";
import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import ChecklistModal from "@/components/landlord/activeLease/ChecklistModal";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import {
  LeaseCardSkeleton,
} from "@/components/Commons/SkeletonLoaders";

import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import UnitMeterReadingsModal from "@/components/landlord/unitBilling/UnitMeterReadingsModal";
import PropertyBulkMeterReadingModal from "@/components/landlord/activeLease/PropertyBulkMeterReadingModal";
import { usePropertyBilling } from "@/hooks/landlord/billing/usePropertyBilling";
import BillingRateStatus from "@/components/landlord/property-billing/BillingRateStatus";
import BillingUnitListMobile from "@/components/landlord/property-billing/BillingUnitListMobile";
import BillingUnitTableDesktop from "@/components/landlord/property-billing/BillingUnitTableDesktop";
import BillingSkeleton from "@/components/landlord/property-billing/BillingSkeleton";

export default function PropertyLeasesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mode, setMode] = useState<"lease" | "billing">("lease");

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

  const billingBlocked = billing.configMissing || billing.payoutMissing;

  const billingMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading || (mode === "billing" && billing.isInitialLoad)) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="px-4 md:px-6 pt-20 md:pt-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-28 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-1 mb-0">
              <div className="h-10 bg-gray-200 rounded-t-xl rounded-b-none w-32 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-t-xl rounded-b-none w-24 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-200 rounded-b-xl rounded-t-none animate-pulse" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            </div>
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
        <div className="mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Active Leases
              </h1>
              <p className="text-xs text-gray-500">
                Manage leases and billing
              </p>
            </div>
          </div>
        </div>

        <div className="mb-0">
          <div className="flex items-end gap-1">
            <button
              onClick={() => setMode("lease")}
              className={`relative px-5 py-2.5 text-sm font-bold rounded-t-xl rounded-b-none transition-all border-b-0 ${
                mode === "lease"
                  ? "bg-white text-blue-700 border-2 border-b-0 border-blue-600 shadow-sm z-10"
                  : "bg-gray-200 text-gray-500 border-2 border-b-0 border-gray-300 hover:bg-gray-300 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Active Leases
              </span>
            </button>

            <button
              onClick={() => setMode("billing")}
              className={`relative px-5 py-2.5 text-sm font-bold rounded-t-xl rounded-b-none transition-all border-b-0 ${
                mode === "billing"
                  ? "bg-white text-emerald-700 border-2 border-b-0 border-emerald-600 shadow-sm z-10"
                  : "bg-gray-200 text-gray-500 border-2 border-b-0 border-gray-300 hover:bg-gray-300 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4" />
                Billing
              </span>
            </button>

            <div className={`flex-1 border-b-2 ${mode === "lease" ? "border-blue-600" : "border-emerald-600"}`} />
          </div>

          <div className={`bg-white border-2 rounded-b-xl rounded-t-none shadow-md -mt-px pt-4 pb-4 px-4 md:px-6 ${
            mode === "lease" ? "border-blue-600" : "border-emerald-600"
          }`}>
            {mode === "lease" && (
              <div className="mb-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search unit, tenant, email, status…"
                  className="w-full max-w-md px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            )}

            {mode === "billing" && (
              <div className="mb-3">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                  {billingMonth}
                </h2>
              </div>
            )}

            {mode === "lease" && (
              <div>
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

            {mode === "billing" && (
              <div className="w-full">
                {/* PERMANENT CONFIG BANNER */}
                {billing.configMissing && (
                  <div className="mb-5 p-5 rounded-xl border-2 border-amber-300 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Settings className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-amber-800 text-base">
                          Configuration Required
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Set up billing due date, reminder day
                          {billing.propertyDetails?.is_submetered ? ", and meter reading date" : ""}{" "}
                          before you can generate bills.
                        </p>
                        <button
                          onClick={() =>
                            router.push(
                              `/landlord/properties/${id}/configurations?id=${id}`
                            )
                          }
                          className="mt-3 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg shadow-md shadow-amber-500/25 transition-all active:scale-95"
                        >
                          Go to Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYOUT BANNER */}
                {billing.payoutMissing && (
                  <div className="mb-5 p-5 rounded-xl border-2 border-amber-300 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-amber-800 text-base">
                          Payout Account Required
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Set your default payout account before issuing billing.
                          This ensures rent payments can be transferred to your bank.
                        </p>
                        <button
                          onClick={() =>
                            router.push("/landlord/settings/payout")
                          }
                          className="mt-3 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg shadow-md shadow-amber-500/25 transition-all active:scale-95"
                        >
                          Set Up Payout Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* BILLING CONTENT (only when configured) */}
                {!billingBlocked && (
                  <>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Billing period for the month
                      </p>

                      <div className="hidden md:grid md:grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                              <Banknote className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">Collected</span>
                          </div>
                          <p className="text-xl font-bold text-emerald-600">
                            ₱{billing.bills
                              .filter((b: any) => b.billing_status?.toLowerCase() === "paid")
                              .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                              .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() === "paid").length} paid
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">Pending</span>
                          </div>
                          <p className="text-xl font-bold text-amber-600">
                            ₱{billing.bills
                              .filter((b: any) => b.billing_status?.toLowerCase() !== "paid")
                              .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                              .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() !== "paid").length} pending
                          </p>
                        </div>

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
                              onClick={() => setBulkMeterOpen(true)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                            >
                              <Gauge className="w-3.5 h-3.5" />
                              Bulk Meter
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="md:hidden">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="bg-gray-50 rounded-xl border border-gray-200 p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                                <Banknote className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[10px] font-medium text-gray-500 truncate">Collected</span>
                            </div>
                            <p className="text-sm font-bold text-emerald-600 truncate">
                              ₱{billing.bills
                                .filter((b: any) => b.billing_status?.toLowerCase() === "paid")
                                .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                                .toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() === "paid").length} paid
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl border border-gray-200 p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[10px] font-medium text-gray-500 truncate">Pending</span>
                            </div>
                            <p className="text-sm font-bold text-amber-600 truncate">
                              ₱{billing.bills
                                .filter((b: any) => b.billing_status?.toLowerCase() !== "paid")
                                .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                                .toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() !== "paid").length} pending
                            </p>
                          </div>

                          <div className="flex flex-col justify-center">
                            {(billing.propertyDetails?.water_billing_type === "submetered" ||
                              billing.propertyDetails?.electricity_billing_type === "submetered") && (
                              <button
                                onClick={() => setBulkMeterOpen(true)}
                                className="w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg font-semibold text-[10px] shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                              >
                                <Gauge className="w-3 h-3" />
                                Bulk
                              </button>
                            )}
                          </div>
                        </div>

                        <BillingRateStatus
                          propertyDetails={billing.propertyDetails}
                          hasBillingForMonth={billing.hasBillingForMonth}
                          billingData={billing.billingData}
                          setIsModalOpen={billing.setIsModalOpen}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                      <button
                        onClick={billing.handleDownloadSummary}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Download Summary
                      </button>
                    </div>

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
      </div>
    </div>
  );
}
