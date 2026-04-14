"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../../../zustand/authStore";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  InboxIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

interface Visit {
  visit_id: number;
  property_name: string;
  unit_name: string;
  visit_date: string;
  visit_time: string;
  status: "pending" | "approved" | "disapproved" | "cancelled";
  disapproval_reason?: string;
  landlord_name?: string;
  landlord_phone?: string;
  landlord_email?: string;
}

const PropertyVisits = () => {
  const { fetchSession, user, admin } = useAuthStore();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">(
    "upcoming"
  );

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/property-finder/viewBookings?tenant_id=${user?.tenant_id}`
        );
        setVisits(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching visits:", error);
        setVisits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isUpcoming = (dateString: string, timeString: string) => {
    const visitDateTime = new Date(`${dateString}T${timeString}`);
    return visitDateTime >= new Date();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Pending Approval",
        dotColor: "bg-amber-500",
        icon: ClockIcon,
      },
      approved: {
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        label: "Confirmed",
        dotColor: "bg-emerald-500",
        icon: CheckCircleIcon,
      },
      disapproved: {
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Declined",
        dotColor: "bg-red-500",
        icon: XCircleIcon,
      },
      cancelled: {
        color: "text-gray-700",
        bg: "bg-gray-50",
        border: "border-gray-200",
        label: "Cancelled",
        dotColor: "bg-gray-400",
        icon: XCircleIcon,
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const upcomingVisits = visits.filter(
    (visit) =>
      (visit.status === "approved" || visit.status === "pending") &&
      isUpcoming(visit.visit_date, visit.visit_time)
  );

  const pastVisits = visits.filter(
    (visit) =>
      visit.status === "disapproved" ||
      visit.status === "cancelled" ||
      !isUpcoming(visit.visit_date, visit.visit_time)
  );

  const activeVisits = selectedTab === "upcoming" ? upcomingVisits : pastVisits;

  const getTimeUntil = (dateString: string, timeString: string) => {
    const visitDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffMs = visitDateTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0)
      return `in ${diffDays} ${diffDays === 1 ? "day" : "days"}`;
    if (diffHours > 0)
      return `in ${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
    if (diffMs > 0) return "soon";
    return "passed";
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <CalendarDaysIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Property Visits
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Manage your viewings
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {visits.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">
                    Upcoming
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {upcomingVisits.length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-emerald-600 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                    Past
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pastVisits.length}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Pills */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedTab("upcoming")}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedTab === "upcoming"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Upcoming ({upcomingVisits.length})
          </button>
          <button
            onClick={() => setSelectedTab("past")}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedTab === "past"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Past ({pastVisits.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 mb-20 sm:mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Status Bar Skeleton */}
              <div className="h-1 bg-gray-200 animate-pulse" />

              <div className="p-4">
                {/* Header Skeleton */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                </div>

                {/* Visit Info Grid Skeleton */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse mb-1" />
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Info Skeleton */}
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <InboxIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Property Visits Yet
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Start exploring properties and book your first visit to find your
              perfect rental home.
            </p>
          </div>
        </div>
      ) : activeVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center py-12 px-6">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No {selectedTab} visits
            </h3>
            <p className="text-sm text-gray-600">
              {selectedTab === "upcoming"
                ? "Your scheduled visits will appear here"
                : "Your completed visits will appear here"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-20 sm:mb-6">
          {activeVisits.map((visit) => {
            const statusConfig = getStatusConfig(visit.status);
            const StatusIcon = statusConfig.icon;
            const timeUntil = getTimeUntil(visit.visit_date, visit.visit_time);

            return (
              <div
                key={visit.visit_id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {/* Status Bar */}
                <div
                  className={`h-1 ${
                    visit.status === "approved"
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                      : visit.status === "pending"
                      ? "bg-amber-400"
                      : visit.status === "disapproved"
                      ? "bg-red-400"
                      : "bg-gray-300"
                  }`}
                />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {visit.property_name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                          <HomeIcon className="w-3.5 h-3.5" />
                          {visit.unit_name}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.border} flex-shrink-0`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusConfig.dotColor
                        } ${
                          visit.status === "approved" ? "animate-pulse" : ""
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Visit Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-bold text-gray-900">
                          {formatDate(visit.visit_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-bold text-gray-900">
                          {formatTime(visit.visit_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Until */}
                  {visit.status === "approved" &&
                    selectedTab === "upcoming" &&
                    timeUntil !== "passed" && (
                      <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            Visit {timeUntil}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Disapproval Reason */}
                  {visit.disapproval_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-900 mb-0.5">
                            Declined - Landlord's Note
                          </p>
                          <p className="text-xs text-red-800">
                            {visit.disapproval_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Landlord Contact */}
                  {visit.status === "approved" &&
                    selectedTab === "upcoming" &&
                    (visit.landlord_phone || visit.landlord_email) && (
                      <div className="pt-3 border-t border-gray-100 mt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Contact Landlord
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visit.landlord_phone && (
                            <a
                              href={`tel:${visit.landlord_phone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              <PhoneIcon className="w-3.5 h-3.5" />
                              Call
                            </a>
                          )}
                          {visit.landlord_email && (
                            <a
                              href={`mailto:${visit.landlord_email}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                            >
                              <EnvelopeIcon className="w-3.5 h-3.5" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PropertyVisits;
