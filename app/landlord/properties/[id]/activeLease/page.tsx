"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import {
  FileText,
  ReceiptText,
  AlertTriangle,
  Banknote,
  Clock,
  Gauge,
  Download,
  Settings,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Calendar,
} from "lucide-react";

import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import ChecklistModal from "@/components/landlord/activeLease/ChecklistModal";
import { LeaseCardSkeleton } from "@/components/Commons/SkeletonLoaders";

import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import UnitMeterReadingsModal from "@/components/landlord/unitBilling/UnitMeterReadingsModal";
import PropertyBulkMeterReadingModal from "@/components/landlord/activeLease/PropertyBulkMeterReadingModal";
import BillingDetailModal from "@/components/landlord/property-billing/BillingDetailModal";
import BillingRateStatus from "@/components/landlord/property-billing/BillingRateStatus";
import BillingUnitListMobile from "@/components/landlord/property-billing/BillingUnitListMobile";
import BillingUnitTableDesktop from "@/components/landlord/property-billing/BillingUnitTableDesktop";
import BillingSkeleton from "@/components/landlord/property-billing/BillingSkeleton";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import { usePropertyBilling } from "@/hooks/landlord/billing/usePropertyBilling";

export default function PropertyLeasesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mode, setMode] = useState<"lease" | "billing">("lease");
  const [statusFilter, setStatusFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>("tenant");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [billingSortColumn, setBillingSortColumn] = useState<string>("tenant");
  const [billingSortDirection, setBillingSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    handleEndLease,
    handleCancelDraftLease,
    scorecards,
    leases,
  } = usePropertyLeases(String(id));

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [bulkMeterOpen, setBulkMeterOpen] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const { data: yearsData } = useSWR(
    id ? `/api/landlord/properties/getStartYearOfLease?property_id=${id}` : null,
    (url: string) => axios.get(url).then((res) => res.data),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const years = useMemo(() => {
    if (yearsData?.years && yearsData.years.length > 0) {
      return [...yearsData.years].sort((a: number, b: number) => a - b);
    }
    return [currentYear];
  }, [yearsData, currentYear]);

  const [billingMonth, setBillingMonth] = useState(currentMonth);
  const [billingYear, setBillingYear] = useState(currentYear);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const isMonthDisabled = (month: number, year: number) => {
    if (year < currentYear) return false;
    if (year > currentYear) return false;
    return month > currentMonth;
  };

  const billing = usePropertyBilling(String(id));

  useEffect(() => {
    billing.setSelectedPeriod({ month: billingMonth, year: billingYear });
  }, [billingMonth, billingYear, billing.setSelectedPeriod]);

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
      `/landlord/properties/${id}/activeLease/extend/${lease.lease_id}`
    );
  };

  const handleAuthenticateLease = (lease: any) => {
    router.push(
      `/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
    );
  };

  const billingBlocked = billing.configMissing || billing.payoutMissing;
  const billingPeriodLabel = `${MONTHS[billingMonth]} ${billingYear}`;

  const getCurrencyFromLocation = () => {
    const prop = billing.propertyDetails;
    if (!prop) return { currency: "PHP", locale: "en-PH", symbol: "₱" };

    const countryMap: Record<string, { currency: string; locale: string; symbol: string }> = {
      PH: { currency: "PHP", locale: "en-PH", symbol: "₱" },
      Philippines: { currency: "PHP", locale: "en-PH", symbol: "₱" },
      US: { currency: "USD", locale: "en-US", symbol: "$" },
      "United States": { currency: "USD", locale: "en-US", symbol: "$" },
      SG: { currency: "SGD", locale: "en-SG", symbol: "S$" },
      Singapore: { currency: "SGD", locale: "en-SG", symbol: "S$" },
      AE: { currency: "AED", locale: "en-AE", symbol: "د.إ" },
      "United Arab Emirates": { currency: "AED", locale: "en-AE", symbol: "د.إ" },
      GB: { currency: "GBP", locale: "en-GB", symbol: "£" },
      "United Kingdom": { currency: "GBP", locale: "en-GB", symbol: "£" },
      AU: { currency: "AUD", locale: "en-AU", symbol: "A$" },
      Australia: { currency: "AUD", locale: "en-AU", symbol: "A$" },
      CA: { currency: "CAD", locale: "en-CA", symbol: "C$" },
      Canada: { currency: "CAD", locale: "en-CA", symbol: "C$" },
      JP: { currency: "JPY", locale: "ja-JP", symbol: "¥" },
      Japan: { currency: "JPY", locale: "ja-JP", symbol: "¥" },
      TH: { currency: "THB", locale: "th-TH", symbol: "฿" },
      Thailand: { currency: "THB", locale: "th-TH", symbol: "฿" },
      MY: { currency: "MYR", locale: "ms-MY", symbol: "RM" },
      Malaysia: { currency: "MYR", locale: "ms-MY", symbol: "RM" },
      ID: { currency: "IDR", locale: "id-ID", symbol: "Rp" },
      Indonesia: { currency: "IDR", locale: "id-ID", symbol: "Rp" },
      VN: { currency: "VND", locale: "vi-VN", symbol: "₫" },
      Vietnam: { currency: "VND", locale: "vi-VN", symbol: "₫" },
      IN: { currency: "INR", locale: "en-IN", symbol: "₹" },
      India: { currency: "INR", locale: "en-IN", symbol: "₹" },
      CN: { currency: "CNY", locale: "zh-CN", symbol: "¥" },
      China: { currency: "CNY", locale: "zh-CN", symbol: "¥" },
      KR: { currency: "KRW", locale: "ko-KR", symbol: "₩" },
      "South Korea": { currency: "KRW", locale: "ko-KR", symbol: "₩" },
    };

    const province = prop.province?.toUpperCase() || "";
    const city = prop.city?.toUpperCase() || "";

    for (const [key, value] of Object.entries(countryMap)) {
      if (province.includes(key.toUpperCase()) || city.includes(key.toUpperCase())) {
        return value;
      }
    }

    return { currency: "PHP", locale: "en-PH", symbol: "₱" };
  };

  const currencyConfig = getCurrencyFromLocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyExact = (amount: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const toggleRowSelection = (leaseId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(leaseId)) {
      newSelected.delete(leaseId);
    } else {
      newSelected.add(leaseId);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedLeases.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedLeases.map((l: any) => l.lease_id)));
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleBillingSort = (column: string) => {
    if (billingSortColumn === column) {
      setBillingSortDirection(billingSortDirection === "asc" ? "desc" : "asc");
    } else {
      setBillingSortColumn(column);
      setBillingSortDirection("asc");
    }
  };

  const sortedBillingBills = useMemo(() => {
    return [...billing.bills].sort((a: any, b: any) => {
      let aValue: any, bValue: any;
      switch (billingSortColumn) {
        case "tenant":
          aValue = a.tenant_name || "";
          bValue = b.tenant_name || "";
          break;
        case "unit":
          aValue = a.unit_name || "";
          bValue = b.unit_name || "";
          break;
        case "prevBalance":
          aValue = Number(a.previous_balance || 0);
          bValue = Number(b.previous_balance || 0);
          break;
        case "currentRent":
          aValue = Number(a.rent_amount || 0);
          bValue = Number(b.rent_amount || 0);
          break;
        case "totalDue":
          aValue = Number(a.total_amount_due || 0);
          bValue = Number(b.total_amount_due || 0);
          break;
        case "status":
          aValue = (a.billing_status || "unpaid").toLowerCase();
          bValue = (b.billing_status || "unpaid").toLowerCase();
          break;
        default:
          aValue = a.tenant_name || "";
          bValue = b.tenant_name || "";
      }

      if (typeof aValue === "string") {
        return billingSortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return billingSortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [billing.bills, billingSortColumn, billingSortDirection]);

  const getStatusBadge = (lease: any) => {
    const status = (lease.status ?? lease.lease_status)?.toLowerCase();
    const endDate = lease.end_date ? new Date(lease.end_date) : null;
    const isExpiringSoon =
      endDate && endDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (status === "active" && isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Expiring Soon
        </span>
      );
    }

    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-emerald-100 text-emerald-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
      "bg-teal-100 text-teal-600",
      "bg-rose-100 text-rose-600",
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const filteredAndSortedLeases = [...filteredLeases]
    .filter((lease: any) => {
      const status = (lease.status ?? lease.lease_status)?.toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      let aValue: any, bValue: any;
      switch (sortColumn) {
        case "tenant":
          aValue = a.tenant_name || "";
          bValue = b.tenant_name || "";
          break;
        case "unit":
          aValue = a.unit_name || "";
          bValue = b.unit_name || "";
          break;
        case "rent":
          aValue = Number(a.monthly_rent || 0);
          bValue = Number(b.monthly_rent || 0);
          break;
        case "deposit":
          aValue = Number(a.security_deposit || 0);
          bValue = Number(b.security_deposit || 0);
          break;
        case "status":
          aValue = (a.status ?? a.lease_status)?.toLowerCase() || "";
          bValue = (b.status ?? b.lease_status)?.toLowerCase() || "";
          break;
        default:
          aValue = a.tenant_name || "";
          bValue = b.tenant_name || "";
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

  const totalPages = Math.ceil(filteredAndSortedLeases.length / itemsPerPage);
  const paginatedLeases = filteredAndSortedLeases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDirection === "asc" ? (
      <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 rotate-180" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const BillingSortIcon = ({ column }: { column: string }) => {
    if (billingSortColumn !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return billingSortDirection === "asc" ? (
      <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 rotate-180" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  if (isLoading || (mode === "billing" && billing.isInitialLoad)) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="px-3 md:px-6 pt-16 md:pt-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2.5 mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-1.5 md:space-y-2">
                <div className="h-5 md:h-6 bg-gray-200 rounded w-32 md:w-40 animate-pulse" />
                <div className="h-2.5 md:h-3 bg-gray-100 rounded w-20 md:w-28 animate-pulse" />
              </div>
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
                    {[...Array(7)].map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...Array(5)].map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {[...Array(7)].map((_, colIdx) => (
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 md:p-4">
        <div className="text-center p-4 md:p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm md:text-base text-red-600 font-medium">Failed to load leases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="px-3 md:px-6 pt-16 md:pt-6">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                Active Leases
              </h1>
             
            </div>
          </div>
        </div>

        {/* ================= TAB SWITCHER ================= */}
        <div className="flex gap-1 mb-4 md:mb-6 bg-gray-100 rounded-xl p-1 w-full md:w-fit">
          <button
            onClick={() => setMode("lease")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all ${
              mode === "lease"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="md:inline">Lease Details</span>
            <span className="md:hidden">Leases</span>
          </button>
          <button
            onClick={() => setMode("billing")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all ${
              mode === "billing"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="md:inline">Billing Mode</span>
            <span className="md:hidden">Billing</span>
          </button>
        </div>

        {mode === "lease" && (
          <>
            {/* ================= TOOLBAR ================= */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
              <div className="p-3 md:p-4 border-b border-gray-100">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <div className="relative w-full md:max-w-md md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tenants or units..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto appearance-none pl-2 md:pl-3 pr-7 md:pr-8 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="all">Status: All</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="expired">Expired</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={termFilter}
                        onChange={(e) => setTermFilter(e.target.value)}
                        className="w-full md:w-auto appearance-none pl-2 md:pl-3 pr-7 md:pr-8 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="all">Term: All</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= TABLE ================= */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3.5 text-left w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedRows.size === paginatedLeases.length &&
                            paginatedLeases.length > 0
                          }
                          onChange={toggleAllSelection}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("tenant")}
                      >
                        <div className="flex items-center gap-1.5">
                          Tenant
                          <SortIcon column="tenant" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("unit")}
                      >
                        <div className="flex items-center gap-1.5">
                          Unit
                          <SortIcon column="unit" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Lease Term
                      </th>
                      <th
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("rent")}
                      >
                        <div className="flex items-center gap-1.5">
                          Rent
                          <SortIcon column="rent" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("deposit")}
                      >
                        <div className="flex items-center gap-1.5">
                          Deposit
                          <SortIcon column="deposit" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1.5">
                          Status
                          <SortIcon column="status" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLeases.map((lease: any) => {
                      const isSelected = selectedRows.has(lease.lease_id);
                      const leaseStatus = (lease.status ?? lease.lease_status)?.toLowerCase();
                      const isDraft = leaseStatus === "draft";
                      return (
                        <tr
                          key={lease.lease_id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-blue-50/50"
                              : "hover:bg-gray-50/50"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(lease.lease_id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Tenant */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(
                                  lease.tenant_name || "Unknown"
                                )}`}
                              >
                                {getInitials(lease.tenant_name || "U")}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {lease.tenant_name || "Unknown Tenant"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {lease.tenant_email || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Unit */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {lease.unit_name || "—"}
                            </span>
                          </td>

                          {/* Lease Term */}
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <p className="font-semibold text-gray-900">
                                {formatDate(lease.start_date)}
                              </p>
                              <p className="text-xs text-gray-500">
                                to {formatDate(lease.end_date)}
                              </p>
                            </div>
                          </td>

                          {/* Rent */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(lease?.rent_amount || 0)}
                              <span className="text-xs text-gray-500 font-normal">
                                /mo
                              </span>
                            </span>
                          </td>

                          {/* Deposit */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(lease.security_deposit || 0)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {getStatusBadge(lease)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isDraft ? (
                                <>
                                  <button
                                    onClick={() => handlePrimaryAction(lease)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Setup Lease
                                  </button>
                                  <button
                                    onClick={() => handleCancelDraftLease(lease)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all active:scale-95"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePrimaryAction(lease)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExtendLease(lease)}
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Extend Lease"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEndLease(lease)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="End Lease"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {paginatedLeases.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center">
                    <FileText className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-2 md:mb-3" />
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      No leases found
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      Leases will appear here once you set them up
                    </p>
                  </div>
                )}
              </div>

              {/* ================= MOBILE VIEW ================= */}
              <div className="md:hidden">
                <LeaseStack
                  leases={paginatedLeases}
                  onPrimary={handlePrimaryAction}
                  onExtend={handleExtendLease}
                  onEnd={handleEndLease}
                  onCancel={handleCancelDraftLease}
                  onKyp={(l) => {
                    setSelectedKypLease(l);
                    setKypOpen(true);
                  }}
                />
              </div>

              {/* ================= PAGINATION ================= */}
              {totalPages > 1 && (
                <div className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    -
                    <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * itemsPerPage, filteredAndSortedLeases.length)}
                    </span>
                    <span className="hidden sm:inline"> of </span>
                    <span className="font-semibold text-gray-900">
                      {filteredAndSortedLeases.length}
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 md:w-8 md:h-8 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= MODALS ================= */}
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
          </>
        )}

        {mode === "billing" && (
          <>
            {/* ================= BILLING PERIOD LABEL ================= */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                Billing Period: {billingPeriodLabel}
              </span>
            </div>

            {/* ================= BILLING SUMMARY CARDS ================= */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 truncate">Collected</span>
                </div>
                <p className="text-base md:text-lg font-bold text-emerald-600 truncate">
                  {formatCurrencyExact(
                    billing.bills
                      .filter((b: any) => b.billing_status?.toLowerCase() === "paid")
                      .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                  )}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() === "paid").length} paid
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 truncate">Pending</span>
                </div>
                <p className="text-base md:text-lg font-bold text-amber-600 truncate">
                  {formatCurrencyExact(
                    billing.bills
                      .filter((b: any) => b.billing_status?.toLowerCase() !== "paid")
                      .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0)
                  )}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {billing.bills.filter((b: any) => b.billing_status?.toLowerCase() !== "paid").length} pending
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                    <Settings className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 truncate">Rates</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
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
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md font-semibold text-[9px] shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white transition-all active:scale-95 truncate"
                    >
                      <Gauge className="w-2.5 h-2.5 shrink-0" />
                      Bulk
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ================= BILLING TABLE ================= */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
              <div className="p-3 md:p-4 border-b border-gray-100">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <div className="relative w-full md:max-w-md md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      placeholder="Search tenants or units..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(Number(e.target.value))}
                        className="w-full md:w-auto appearance-none pl-2 md:pl-3 pr-7 md:pr-8 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      >
                        {MONTHS.map((name, idx) => (
                          <option key={idx} value={idx} disabled={isMonthDisabled(idx, billingYear)}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={billingYear}
                        onChange={(e) => setBillingYear(Number(e.target.value))}
                        className="w-full md:w-auto appearance-none pl-2 md:pl-3 pr-7 md:pr-8 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 md:flex-none">
                      <select className="w-full md:w-auto appearance-none pl-2 md:pl-3 pr-7 md:pr-8 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                        <option>Status: All</option>
                        <option>Paid</option>
                        <option>Unpaid</option>
                        <option>Overdue</option>
                        <option>Processing</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={billing.handleDownloadSummary}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all active:scale-95 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download Summary</span>
                      <span className="sm:hidden">Summary</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= BILLING TABLE ================= */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3.5 text-left w-12">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("tenant")}>
                        <div className="flex items-center gap-1.5">Tenant <BillingSortIcon column="tenant" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("unit")}>
                        <div className="flex items-center gap-1.5">Unit <BillingSortIcon column="unit" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("prevBalance")}>
                        <div className="flex items-center justify-end gap-1.5">Prev. Balance <BillingSortIcon column="prevBalance" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("currentRent")}>
                        <div className="flex items-center justify-end gap-1.5">Current Rent <BillingSortIcon column="currentRent" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("totalDue")}>
                        <div className="flex items-center justify-end gap-1.5">Total Due <BillingSortIcon column="totalDue" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleBillingSort("status")}>
                        <div className="flex items-center gap-1.5">Status <BillingSortIcon column="status" /></div>
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedBillingBills.map((bill: any) => {
                      const status = bill.billing_status?.toLowerCase() || "no_bill";
                      const prevBalance = Number(bill.previous_balance || 0);
                      const currentRent = Number(bill.rent_amount || 0);
                      const totalDue = Number(bill.total_amount_due || 0);
                      const isOverdue = status === "overdue";
                      const isPaid = status === "paid";
                      const isProcessing = status === "processing";
                      const isNoBill = status === "no_bill";
                      const isCurrentPeriod = billingMonth === currentMonth && billingYear === currentYear;

                      return (
                        <tr key={bill.bill_id || bill.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(bill.tenant_name || "Unknown")}`}>
                                {getInitials(bill.tenant_name || "U")}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{bill.tenant_name || "Unknown Tenant"}</p>
                                <p className="text-xs text-gray-500 truncate">{bill.tenant_email || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-gray-900">{bill.unit_name || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${prevBalance > 0 ? "text-red-600" : "text-gray-500"}`}>
                              {formatCurrency(prevBalance)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(currentRent)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(totalDue)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Overdue
                              </span>
                            ) : isProcessing ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                <Clock className="w-3.5 h-3.5" />
                                Processing
                              </span>
                            ) : isNoBill ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                <FileText className="w-3.5 h-3.5" />
                                No Bill
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isNoBill && isCurrentPeriod ? (
                                <button
                                  onClick={() => router.push(`/landlord/properties/${id}/billing/createUnitBill/${bill.lease_id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  Create Unit Bill
                                </button>
                              ) : !isNoBill ? (
                                <button
                                  onClick={() => setSelectedBillForDetail(bill)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Bill
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {billing.bills.length === 0 && !billing.loadingBills && (
                  <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center">
                    <ReceiptText className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-2 md:mb-3" />
                    <p className="text-sm md:text-base font-semibold text-gray-900">No bills found</p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Bills will appear here once generated</p>
                  </div>
                )}
              </div>

              {/* ================= MOBILE BILLING VIEW ================= */}
              <div className="md:hidden">
                <BillingUnitListMobile
                  bills={billing.bills}
                  loadingBills={billing.loadingBills}
                  propertyDetails={billing.propertyDetails}
                  router={billing.router}
                  property_id={billing.property_id}
                  guardActionWithConfig={billing.guardBillingAction}
                  getStatusConfig={billing.getStatusConfig}
                  isCreateBillAllowed={billingMonth === currentMonth && billingYear === currentYear}
                  onViewBill={(bill: any) => setSelectedBillForDetail(bill)}
                />
              </div>

              {/* ================= PAGINATION ================= */}
              {billing.bills.length > 10 && (
                <div className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{billing.bills.length}</span> bills
                  </p>
                </div>
              )}
            </div>

            {/* ================= BILLING MODALS ================= */}
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

            <BillingDetailModal
              isOpen={!!selectedBillForDetail}
              onClose={() => setSelectedBillForDetail(null)}
              billing_id={selectedBillForDetail?.billing_id || ""}
              lease_id={selectedBillForDetail?.lease_id || ""}
              month={billingMonth}
              year={billingYear}
            />
          </>
        )}
      </div>
    </div>
  );
}