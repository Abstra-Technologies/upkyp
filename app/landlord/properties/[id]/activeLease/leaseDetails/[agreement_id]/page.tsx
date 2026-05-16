"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Receipt,
  ArrowLeft,
  AlertCircle,
  MoreVertical,
  Calendar,
  User,
  Shield,
  RefreshCw,
  Edit3,
  FileCog,
  Home,
} from "lucide-react";

import LeasePayments from "@/components/landlord/activeLease/leasePayments";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";
import LeaseBilling from "@/components/landlord/activeLease/LeaseBilling";
import { usePropertyBillingLeases } from "@/hooks/landlord/activeLease/usePropertyBillingLeases";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import ModifyLeaseDatesModal from "@/components/landlord/activeLease/ModifyLeaseDatesModal";
import TenantInfoModal from "@/components/landlord/activeLease/TenantInfoModal";

interface LeaseDetails {
  lease_id: string;
  property_id?: number;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  tenant_id?: string;
  start_date: string;
  end_date: string;
  lease_status: string;
  agreement_url?: string;
}

export default function LeaseDetailsPage() {
  const { agreement_id } = useParams();
  const router = useRouter();

  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("billing");
  const [showMobileActions, setShowMobileActions] = useState(false);

  const [kypOpen, setKypOpen] = useState(false);
  const [selectedKypLease, setSelectedKypLease] = useState<any | null>(null);
  const [modifyDatesOpen, setModifyDatesOpen] = useState(false);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const { handleEndLease } = usePropertyBillingLeases(
    lease?.property_id ? String(lease.property_id) : "",
  );

  /* ===============================
     FETCH DETAILS
  ================================ */
  useEffect(() => {
    if (!agreement_id) return;

    const fetchLeaseDetails = async () => {
      try {
        const res = await fetch(
          `/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`,
        );
        const data = await res.json();
        setLease(data);
      } catch (err) {
        console.error("Error fetching lease details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [agreement_id]);

  // Close mobile actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMobileActions(false);
    if (showMobileActions) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showMobileActions]);

  /* ===============================
     STATE GUARDS
  ================================ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading lease details...
          </p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Lease Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            The lease agreement could not be found or may have been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ===============================
     NORMALIZED STATUS
  ================================ */
  const status = lease.lease_status?.toLowerCase();
  const isActive = status === "active";
  const isExpired = status === "expired";
  const isDraft = status === "draft";
  const hasAgreement = !!lease.agreement_url;

  const handleSetupLease = () => {
    router.push(
      `/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${lease.agreement_id || lease.lease_id}`
    );
  };

  const statusConfig: Record<
    string,
    { bg: string; text: string; dot: string }
  > = {
    active: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-600",
    },
    expired: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-600" },
    terminated: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600" },
    pending: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-600" },
  };

  const currentStatusConfig = statusConfig[status] || statusConfig.pending;

  /* ===============================
     HANDLERS
  ================================ */
  const handleExtendLease = () => {
    router.push(
      `/landlord/properties/${lease.property_id}/activeLease/extend/${lease.lease_id}`,
    );
  };

  const handleViewEKyp = () => {
    if (!lease) return;
    setSelectedKypLease(lease);
    setKypOpen(true);
  };

  const handleModifyDates = () => {
    setModifyDatesOpen(true);
  };

  const handleModifyDatesSuccess = async () => {
    const res = await fetch(
      `/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`,
    );
    const data = await res.json();
    setLease(data);
  };

  const handleViewTenant = () => {
    if (lease?.tenant_id) {
      setSelectedTenantId(lease.tenant_id);
      setTenantModalOpen(true);
    }
  };

  const tabs = [
    { key: "billing", label: "Billing", icon: Receipt },
    { key: "payments", label: "Payments", icon: CreditCard },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50">
      {/* Mobile Sub-Header - sits below layout navbar */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900 truncate max-w-[160px]">
              {lease.unit_name}
            </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${currentStatusConfig.bg} ${currentStatusConfig.text}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}
              />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {(isActive || isExpired) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileActions(!showMobileActions);
                }}
                className="p-1.5 -mr-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>

              {showMobileActions && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  {isActive && (
                    <>
                      <button
                        onClick={() => {
                          handleViewEKyp();
                          setShowMobileActions(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        View eKYP ID
                      </button>
                      <button
                        onClick={() => {
                          handleModifyDates();
                          setShowMobileActions(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2.5"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modify Dates
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => {
                          handleEndLease(lease);
                          setShowMobileActions(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Terminate Lease
                      </button>
                    </>
                  )}
                  {isExpired && (
                    <button
                      onClick={() => {
                        handleExtendLease();
                        setShowMobileActions(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Extend Lease
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-16 pb-28 md:pt-8 md:px-6 lg:px-10 xl:px-16 md:pb-12 max-w-5xl mx-auto">
        {/* Desktop Back Button */}
        <button
          onClick={() => router.back()}
          className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Leases</span>
        </button>

        {/* Lease Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md mb-4 md:mb-6 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
          <div className="p-4 md:p-5">
            {/* Desktop: Property + Unit header */}
            <div className="hidden md:flex md:items-center md:justify-between md:mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {lease.property_name}
                  </h2>
                  <p className="text-sm text-gray-600">{lease.unit_name}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${currentStatusConfig.bg} ${currentStatusConfig.text}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}
                />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>

            {/* Lease Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Tenant */}
              <div className="col-span-2 md:col-span-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Tenant
                </p>
                <button
                  onClick={handleViewTenant}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{lease.tenant_name}</span>
                </button>
              </div>

              {/* Start Date */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Start Date
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {lease.start_date ? formatDate(lease.start_date) : "N/A"}
                </div>
              </div>

              {/* End Date */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  End Date
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {lease.end_date ? (
                    formatDate(lease.end_date)
                  ) : (
                    <span className="text-emerald-600 font-semibold">Open Lease</span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            {(isActive || isExpired) && (
              <div className="hidden md:flex items-center gap-2 mt-5 pt-5 border-t border-gray-200">
                {isActive && (
                  <>
                    <button
                      onClick={handleViewEKyp}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      View eKYP ID
                    </button>
                    <button
                      onClick={handleModifyDates}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modify Dates
                    </button>
                    <button
                      onClick={() => handleEndLease(lease)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Terminate
                    </button>
                  </>
                )}
                {isExpired && (
                  <button
                    onClick={handleExtendLease}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ml-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Extend Lease
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Setup Lease Banner */}
        {isDraft && !hasAgreement && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3.5 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <FileCog className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Lease Not Setup
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Upload and configure the lease agreement to enable tracking.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSetupLease}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <FileCog className="w-3.5 h-3.5" />
                Setup Lease
              </button>
            </div>
          </div>
        )}

        {/* Tabs Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors flex-1 min-w-0 ${
                    activeTab === key
                      ? "text-blue-700 bg-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>

                  {activeTab === key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-3 md:p-5">
            {activeTab === "billing" && (
              <LeaseBilling lease_id={lease.lease_id} />
            )}
            {activeTab === "payments" && <LeasePayments lease={lease} />}
            {activeTab === "pdcs" && <LeasePDCs lease={lease} />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      {(isActive || isExpired) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg px-4 py-3 md:hidden safe-area-bottom z-40">
          <div className="flex gap-2">
            {isActive && (
              <>
                <button
                  onClick={handleViewEKyp}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg active:scale-[0.98] transition-transform"
                >
                  <Shield className="w-3.5 h-3.5" />
                  eKYP
                </button>
                <button
                  onClick={() => handleEndLease(lease)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold bg-red-600 text-white rounded-lg active:scale-[0.98] transition-transform"
                >
                  Terminate
                </button>
              </>
            )}
            {isExpired && (
              <button
                onClick={handleExtendLease}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg active:scale-[0.98] transition-transform"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Extend Lease
              </button>
            )}
          </div>
        </div>
      )}

      <EKypModal
        open={kypOpen}
        lease={selectedKypLease}
        onClose={() => {
          setKypOpen(false);
          setSelectedKypLease(null);
        }}
      />

      <ModifyLeaseDatesModal
        isOpen={modifyDatesOpen}
        lease={lease}
        onClose={() => setModifyDatesOpen(false)}
        onSuccess={handleModifyDatesSuccess}
      />

      <TenantInfoModal
        isOpen={tenantModalOpen}
        tenantId={selectedTenantId}
        onClose={() => {
          setTenantModalOpen(false);
          setSelectedTenantId("");
        }}
      />
    </div>
  );
}
