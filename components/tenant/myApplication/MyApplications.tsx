"use client";

import { useEffect, useState } from "react";
import {
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  HomeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";

type Application = {
  id: number;
  unit_id: number | null;
  unit_name?: string;
  valid_id: string;
  proof_of_income?: string;
  message?: string;
  status: "pending" | "approved" | "disapproved";
  created_at: string;
  updated_at: string;
  property_name?: string;
  proceeded?: "yes" | "no";
};

export default function MyApplications({ tenantId }: { tenantId: number }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(
          `/api/tenant/applications/listofApplications?tenantId=${tenantId}`
        );
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || "Failed to fetch applications.");
        }

        if (Array.isArray(result)) {
          setApplications(result);
        } else if (Array.isArray(result.applications)) {
          setApplications(result.applications);
        } else {
          throw new Error("Unexpected response format.");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchApplications();
    } else {
      router.push("/tenant/login");
    }
  }, [tenantId, router]);

  const handleTenantDecision = async (
    applicationId: number,
    decision: "yes" | "no"
  ) => {
    try {
      setProcessingId(applicationId);
      await axios.post(
        `/api/tenant/applications/applicationDecision/${applicationId}/proceed`,
        { decision }
      );
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, proceeded: decision } : a
        )
      );
    } catch (error) {
      console.error("Failed to update tenant decision", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      approved: {
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        label: "Approved",
        dotColor: "bg-emerald-500",
        icon: CheckCircleIcon,
      },
      disapproved: {
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Disapproved",
        dotColor: "bg-red-500",
        icon: XCircleIcon,
      },
      pending: {
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Pending",
        dotColor: "bg-amber-500",
        icon: ClockIcon,
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const paginatedApps = applications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(applications.length / pageSize);

  const stats = {
    total: applications.length,
    approved: applications.filter((app) => app.status === "approved").length,
    pending: applications.filter((app) => app.status === "pending").length,
    disapproved: applications.filter((app) => app.status === "disapproved")
      .length,
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4"
            >
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-2" />
              <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="h-1.5 bg-gray-200 animate-pulse" />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <DocumentIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              My Applications
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Track and manage your rental applications
            </p>
          </div>
        </div>

        {/* Stats Summary - Desktop Only */}
        {applications.length > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {stats.approved} Approved
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {stats.pending} Pending
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Stats Cards */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DocumentIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-3 sm:p-4 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">
                  Approved
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.approved}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-700">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-red-200 p-3 sm:p-4 hover:border-red-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase mb-1">
                  Disapproved
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.disapproved}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2 items-center mb-6">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
          {error}
        </div>
      )}

      {/* Empty */}
      {!error && applications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            No Applications Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
            Browse available properties to start your first application.
          </p>
          <button
            onClick={() => router.push("/tenant/my-unit")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium text-sm hover:opacity-90"
          >
            Browse Properties
          </button>
        </div>
      )}

      {/* Applications List */}
      {applications.length > 0 && (
        <div className="space-y-3 sm:space-y-4 mb-20 sm:mb-6">
          {paginatedApps.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all group overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`h-1 sm:h-1.5 ${
                    app.status === "approved"
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                      : app.status === "pending"
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />

                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    {/* Left Section - Property Info */}
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      {/* Property Name & Status */}
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                              {app.property_name || "Property"}
                            </h3>
                            {app.unit_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium text-gray-600">
                                  Unit
                                </span>
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-bold">
                                  {app.unit_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} flex-shrink-0`}
                        >
                          <span
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                          />
                          <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-bold text-xs sm:text-sm">
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Application Date */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm pl-9 sm:pl-14">
                        <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 font-medium">
                          Applied on:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(app.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {app.message && (
                    <p className="text-xs sm:text-sm text-gray-700 italic border-l-4 border-blue-500 pl-3 py-1 mt-3 bg-blue-50">
                      "{app.message}"
                    </p>
                  )}

                  {/* Decision Buttons */}
                  {app.status === "approved" && !app.proceeded && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <button
                        onClick={() => handleTenantDecision(app.id, "yes")}
                        disabled={processingId === app.id}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {processingId === app.id
                          ? "Processing..."
                          : "Proceed with Lease"}
                      </button>
                      <button
                        onClick={() => handleTenantDecision(app.id, "no")}
                        disabled={processingId === app.id}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 transition-colors"
                      >
                        {processingId === app.id ? "Processing..." : "Decline"}
                      </button>
                    </div>
                  )}

                  {/* Decision Display */}
                  {app.status === "approved" && app.proceeded && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-sm font-medium border ${
                        app.proceeded === "yes"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {app.proceeded === "yes"
                        ? "✅ You chose to proceed with this lease"
                        : "❌ You declined this lease"}
                    </div>
                  )}

                  {/* Disapproved */}
                  {app.status === "disapproved" && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-sm text-rose-700 rounded-lg">
                      ❌ Application not approved — you can apply for other
                      units.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-20 sm:mb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 text-sm rounded-lg font-semibold transition-all ${
                  currentPage === i + 1
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
