"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"; // ✅ Added UTC plugin
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  CalendarDays,
  UserCheck,
  CalendarX,
  List,
  Grid3X3,
  X,
} from "lucide-react";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

// ✅ Enable UTC plugin
dayjs.extend(utc);

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const BookingAppointment = () => {
  const { fetchSession, user } = useAuthStore();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");

  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) fetchSession();
    if (user?.landlord_id) fetchVisits();
  }, [user]);

  const fetchVisits = async () => {
    try {
      const res = await axios.get(
        `/api/landlord/properties/getAllBookingVisits?landlord_id=${user?.landlord_id}`,
      );
      setVisits(res.data || []);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use UTC to prevent timezone shift
  const visitsByDate = visits.reduce<Record<string, any[]>>((acc, visit) => {
    const key = dayjs.utc(visit.visit_date).format("YYYY-MM-DD");
    acc[key] = acc[key] || [];
    acc[key].push(visit);
    return acc;
  }, {});

  const statusCounts = visits.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.status] = (acc[visit.status] || 0) + 1;
    return acc;
  }, {});

  const selectedDateVisits =
    visitsByDate[selectedDate.format("YYYY-MM-DD")] || [];

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      `${visit.tenant_first_name} ${visit.tenant_last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      visit.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (
    visit_id: number,
    status: string,
    reason?: string,
  ) => {
    await axios.put("/api/landlord/properties/updateBookingStatus", {
      visit_id,
      status,
      reason,
    });
    setVisits((prev) =>
      prev.map((v) =>
        v.visit_id === visit_id
          ? { ...v, status, disapproval_reason: reason }
          : v,
      ),
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      disapproved: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const VisitCard = ({ visit, compact = false }: any) => (
    <motion.div
      variants={fadeInUp}
      className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
    >
      <div className="flex justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {visit.tenant_first_name} {visit.tenant_last_name}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {visit.property_name} • {visit.unit_name}
          </p>
          {/* ✅ FIXED: Use UTC to display correct date */}
          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dayjs.utc(visit.visit_date).format("MMM D, YYYY")} •{" "}
            {visit.visit_time}
          </p>
          {visit.disapproval_reason && (
            <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded-lg">
              Reason: {visit.disapproval_reason}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={visit.status} />

          {visit.status === "pending" && !compact && (
            <div className="flex gap-1.5">
              <button
                onClick={() => updateStatus(visit.visit_id, "approved")}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={() => {
                  setSelectedVisitId(visit.visit_id);
                  setShowDisapprovalModal(true);
                }}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}

          {visit.status === "approved" && !compact && (
            <button
              onClick={() => {
                setSelectedVisitId(visit.visit_id);
                setShowCancellationModal(true);
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CalendarX className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const CalendarView = () => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = currentMonth.endOf("month").endOf("week");
    const days = [];
    let d = start;

    while (d.isBefore(end) || d.isSame(end, "day")) {
      days.push(d);
      d = d.add(1, "day");
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-900">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 p-3 text-xs font-semibold text-gray-500 text-center border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-3">
          {days.map((date) => {
            const key = date.format("YYYY-MM-DD");
            const dayVisits = visitsByDate[key] || [];
            const isSelected = date.isSame(selectedDate, "day");
            const isToday = date.isSame(dayjs(), "day");
            const isCurrentMonth = date.month() === currentMonth.month();

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(date)}
                className={`p-2 min-h-[70px] border rounded-xl transition-all duration-200 text-left ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-300 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? "w-7 h-7 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-full flex items-center justify-center"
                      : "text-gray-700"
                  }`}
                >
                  {date.date()}
                </span>

                {dayVisits.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {dayVisits.slice(0, 2).map((v, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          v.status === "approved"
                            ? "bg-emerald-500"
                            : v.status === "pending"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                        }`}
                      />
                    ))}
                    {dayVisits.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{dayVisits.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 px-4 md:px-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 pt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
              <p className="text-gray-600 text-sm">
                Manage property visit requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700">
                {statusCounts.pending || 0}
              </span>
            </div>
            <p className="text-sm text-amber-600">Pending</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-700">
                {statusCounts.approved || 0}
              </span>
            </div>
            <p className="text-sm text-emerald-600">Approved</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <XCircle className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700">
                {statusCounts.disapproved || 0}
              </span>
            </div>
            <p className="text-sm text-orange-600">Declined</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">
                {visitsByDate[dayjs().format("YYYY-MM-DD")]?.length || 0}
              </span>
            </div>
            <p className="text-sm text-blue-600">Today</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "list"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "calendar" && (
              <>
                <CalendarView />

                {/* Selected Date Visits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">
                      {selectedDate.format("MMMM D, YYYY")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedDateVisits.length} visit
                      {selectedDateVisits.length !== 1 ? "s" : ""} scheduled
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedDateVisits.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No visits scheduled for this day
                        </p>
                      </div>
                    ) : (
                      selectedDateVisits.map((v) => (
                        <VisitCard key={v.visit_id} visit={v} />
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === "list" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                      placeholder="Search visits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disapproved">Declined</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredVisits.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No visits found</p>
                    </div>
                  ) : (
                    filteredVisits.map((v) => (
                      <VisitCard key={v.visit_id} visit={v} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Pending Requests</h3>
              </div>
              <div className="p-4 space-y-3">
                {visits.filter((v) => v.status === "pending").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  visits
                    .filter((v) => v.status === "pending")
                    .slice(0, 3)
                    .map((v) => (
                      <VisitCard key={v.visit_id} visit={v} compact />
                    ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Visits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 bg-emerald-50 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Upcoming Visits</h3>
              </div>
              <div className="p-4 space-y-3">
                {/* ✅ FIXED: Use UTC for date comparison */}
                {visits.filter(
                  (v) =>
                    v.status === "approved" &&
                    dayjs.utc(v.visit_date).isAfter(dayjs()),
                ).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming visits
                  </p>
                ) : (
                  visits
                    .filter(
                      (v) =>
                        v.status === "approved" &&
                        dayjs.utc(v.visit_date).isAfter(dayjs()),
                    )
                    .slice(0, 3)
                    .map((v) => (
                      <VisitCard key={v.visit_id} visit={v} compact />
                    ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Disapproval Modal */}
      <AnimatePresence>
        {showDisapprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Decline Visit
                </h2>
                <button
                  onClick={() => setShowDisapprovalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4"
                rows={4}
                placeholder="Reason for declining..."
                value={disapprovalReason}
                onChange={(e) => setDisapprovalReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisapprovalModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateStatus(
                      selectedVisitId!,
                      "disapproved",
                      disapprovalReason,
                    );
                    setShowDisapprovalModal(false);
                    setDisapprovalReason("");
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium"
                >
                  Decline Visit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancellationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Cancel Visit
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this visit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancellationModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Keep Visit
                </button>
                <button
                  onClick={() => {
                    updateStatus(selectedVisitId!, "cancelled");
                    setShowCancellationModal(false);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium"
                >
                  Cancel Visit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingAppointment;
