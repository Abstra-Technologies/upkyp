"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Info,
  CreditCard,
  Receipt,
  CheckSquare,
  ArrowLeft,
  AlertCircle,
  MoreVertical,
  Calendar,
  User,
  Building2,
  Shield,
  RefreshCw,
  Edit3,
} from "lucide-react";

import LeaseInfo from "@/components/landlord/activeLease/leaseInfo";
import LeasePayments from "@/components/landlord/activeLease/leasePayments";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";
import LeaseBilling from "@/components/landlord/activeLease/LeaseBilling";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import ModifyLeaseDatesModal from "@/components/landlord/activeLease/ModifyLeaseDatesModal";

interface LeaseDetails {
  lease_id: string;
  property_id?: number;
  property_name: string;
  unit_name: string;
  tenant_name: string;
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
  const [activeTab, setActiveTab] = useState("info");
  const [showMobileActions, setShowMobileActions] = useState(false);

  const [kypOpen, setKypOpen] = useState(false);
  const [selectedKypLease, setSelectedKypLease] = useState<any | null>(null);
  const [modifyDatesOpen, setModifyDatesOpen] = useState(false);

  const { handleEndLease } = usePropertyLeases(
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Loading lease details...
          </p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Lease Not Found
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              The lease agreement you're looking for could not be found or may
              have been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
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

  const statusConfig: Record<
    string,
    { bg: string; text: string; dot: string }
  > = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    expired: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    terminated: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  };

  const currentStatusConfig = statusConfig[status] || statusConfig.pending;

  /* ===============================
     HANDLERS
  ================================ */
  const handleExtendLease = () => {
    router.push(
      `/pages/landlord/properties/${lease.property_id}/activeLease/extend/${lease.lease_id}`,
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

  const tabs = [
    { key: "info", label: "Info", icon: Info },
    { key: "billing", label: "Billing", icon: Receipt },
    { key: "payments", label: "Payments", icon: CreditCard },
    // { key: "pdcs", label: "PDCs", icon: CheckSquare },
  ];

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile Header - Fixed */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 -ml-2 px-2 py-1 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
            {lease.unit_name}
          </h1>

          {(isActive || isExpired) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileActions(!showMobileActions);
                }}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>

              {showMobileActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {isActive && (
                    <>
                      <button
                        onClick={handleViewEKyp}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        View eKYP ID
                      </button>
                      <button
                        onClick={handleModifyDates}
                        className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-3"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modify Dates
                      </button>
                      <button
                        onClick={() => handleEndLease(lease)}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Terminate Lease
                      </button>
                    </>
                  )}
                  {isExpired && (
                    <button
                      onClick={handleExtendLease}
                      className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-3"
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

      <div className="px-4 pt-4 pb-28 md:pt-8 md:px-8 lg:px-12 xl:px-16 md:pb-12 max-w-7xl mx-auto">
        {/* Desktop Back Button */}
        <button
          onClick={() => router.back()}
          className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Leases</span>
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          {/* Gradient Banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
          </div>

          <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12 relative">
            {/* Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border-4 border-white">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>

            {/* Title & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {lease.property_name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${currentStatusConfig.bg} ${currentStatusConfig.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dot}`}
                    />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {lease.unit_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    {lease.tenant_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {lease.start_date
                      ? new Date(lease.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}{" "}
                    →{" "}
                    {lease.end_date
                      ? new Date(lease.end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Ongoing"}
                  </span>
                </div>
              </div>

              {/* Desktop Action Buttons */}
              {(isActive || isExpired) && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <>
                      <button
                        onClick={handleViewEKyp}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Shield className="w-4 h-4" />
                        View eKYP ID
                      </button>
                      <button
                        onClick={handleModifyDates}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modify Dates
                      </button>
                      <button
                        onClick={() => handleEndLease(lease)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Terminate
                      </button>
                    </>
                  )}
                  {isExpired && (
                    <button
                      onClick={handleExtendLease}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Extend Lease
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors flex-1 sm:flex-none min-w-[80px] ${
                    activeTab === key
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xs:inline sm:inline">{label}</span>

                  {activeTab === key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === "info" && <LeaseInfo lease={lease} />}
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 md:hidden safe-area-bottom">
          <div className="flex gap-3">
            {isActive && (
              <>
                <button
                  onClick={handleViewEKyp}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-xl active:scale-[0.98] transition-transform"
                >
                  <Shield className="w-4 h-4" />
                  eKYP ID
                </button>
                <button
                  onClick={() => handleEndLease(lease)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-red-600 text-white rounded-xl active:scale-[0.98] transition-transform"
                >
                  Terminate
                </button>
              </>
            )}
            {isExpired && (
              <button
                onClick={handleExtendLease}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-emerald-600 text-white rounded-xl active:scale-[0.98] transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
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
    </div>
  );
}
