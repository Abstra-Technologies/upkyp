"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Wrench,
  X,
  Filter,
  Calendar,
  Home,
  Clock,
  CheckCircle,
  Play,
  CalendarClock,
  XCircle,
  RefreshCw,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import {
  getStatusConfig,
  getPriorityConfig,
  normalizeStatus,
} from "@/components/landlord/maintenance_management/getStatusConfig";
import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";
import MaintenanceExpenseModal from "@/components/landlord/maintenance_management/MaintenanceExpenseModal";
import NewWorkOrderModal from "@/components/landlord/maintenance_management/NewWorkOrderModal";

// ============================================
// TYPES
// ============================================
interface MaintenanceRequest {
  request_id: number;
  subject: string;
  description?: string;
  status: string;
  priority_level: string;
  category: string;
  assigned_to?: string;
  schedule_date?: string;
  completion_date?: string;
  created_at: string;
  tenant_id?: number;
  tenant_first_name?: string;
  tenant_last_name?: string;
  property_id?: number;
  property_name?: string;
  unit_id?: number;
  unit_name?: string;
  photo_urls?: string[];
}

interface NextAction {
  label: string;
  status: string;
  color: string;
  needsDate?: boolean;
}

interface KanbanColumnConfig {
  id: string;
  title: string;
  subtitle: string;
  statuses: string[];
  gradient: string;
  bgLight: string;
  dotColor: string;
  textColor: string;
  Icon: React.ComponentType<{ className?: string }>;
  acceptsFrom: string[];
  nextActions: NextAction[];
  mobileLabel: string;
}

// ============================================
// KANBAN COLUMNS CONFIG
// ============================================
const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "pending",
    title: "Pending Review",
    subtitle: "Awaiting approval",
    statuses: ["pending"],
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    dotColor: "bg-amber-500",
    textColor: "text-amber-600",
    Icon: Clock,
    acceptsFrom: [],
    mobileLabel: "Pending",
    nextActions: [
      {
        label: "Approve",
        status: "approved",
        color: "bg-emerald-500 hover:bg-emerald-600",
      },
      {
        label: "Reject",
        status: "rejected",
        color: "bg-red-500 hover:bg-red-600",
      },
    ],
  },
  {
    id: "approved",
    title: "Approved",
    subtitle: "Ready to schedule",
    statuses: ["approved"],
    gradient: "from-emerald-500 to-green-500",
    bgLight: "bg-emerald-50",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-600",
    Icon: CheckCircle,
    acceptsFrom: ["pending"],
    mobileLabel: "Approved",
    nextActions: [
      {
        label: "Schedule",
        status: "scheduled",
        color: "bg-purple-500 hover:bg-purple-600",
        needsDate: true,
      },
    ],
  },
  {
    id: "scheduled",
    title: "Scheduled",
    subtitle: "Work date set",
    statuses: ["scheduled"],
    gradient: "from-purple-500 to-indigo-500",
    bgLight: "bg-purple-50",
    dotColor: "bg-purple-500",
    textColor: "text-purple-600",
    Icon: CalendarClock,
    acceptsFrom: ["approved"],
    mobileLabel: "Scheduled",
    nextActions: [
      {
        label: "Start Work",
        status: "in-progress",
        color: "bg-blue-500 hover:bg-blue-600",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    subtitle: "Work underway",
    statuses: ["in-progress"],
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    dotColor: "bg-blue-500",
    textColor: "text-blue-600",
    Icon: Play,
    acceptsFrom: ["scheduled"],
    mobileLabel: "Active",
    nextActions: [
      {
        label: "Complete",
        status: "completed",
        color: "bg-green-500 hover:bg-green-600",
      },
    ],
  },
  {
    id: "resolved",
    title: "Resolved",
    subtitle: "Completed & rejected",
    statuses: ["completed", "rejected"],
    gradient: "from-gray-500 to-slate-600",
    bgLight: "bg-gray-50",
    dotColor: "bg-gray-500",
    textColor: "text-gray-600",
    Icon: CheckCircle,
    acceptsFrom: ["in-progress", "pending"],
    mobileLabel: "Done",
    nextActions: [],
  },
];

const getColumnForStatus = (status: string) => {
  const normalized = normalizeStatus(status);
  return KANBAN_COLUMNS.find((col) => col.statuses.includes(normalized));
};

function transformApiResponse(data: any[]): MaintenanceRequest[] {
  return data.map((item) => ({
    request_id: item.request_id,
    subject: item.subject,
    description: item.description,
    status: normalizeStatus(item.status),
    priority_level: item.priority_level || "Low",
    category: item.category || "General",
    assigned_to: item.assigned_to,
    schedule_date: item.schedule_date,
    completion_date: item.completion_date,
    created_at: item.created_at,
    tenant_id: item.tenant?.tenant_id || null,
    tenant_first_name: item.tenant?.first_name || null,
    tenant_last_name: item.tenant?.last_name || null,
    property_id: item.property?.property_id,
    property_name: item.property?.property_name,
    unit_id: item.unit?.unit_id || null,
    unit_name: item.unit?.unit_name || null,
    photo_urls: item.photo_urls || [],
  }));
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function MaintenanceRequestPage() {
  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    requestId: number;
    status: string;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSource, setFilterSource] = useState<
    "all" | "tenant" | "landlord"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const [draggedItem, setDraggedItem] = useState<MaintenanceRequest | null>(
    null,
  );
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Fetch
  const fetchRequests = useCallback(
    async (showRefresh = false) => {
      if (!landlordId) return;
      if (showRefresh) setRefreshing(true);

      try {
        const res = await axios.get(
          `/api/maintenance/getAllMaintenance?landlord_id=${landlordId}`,
        );
        if (res.data.success) {
          setRequests(transformApiResponse(res.data.data));
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [landlordId],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Status update
  const updateRequestStatus = async (
    requestId: number,
    newStatus: string,
    extraData: Record<string, any> = {},
  ) => {
    const normalized = normalizeStatus(newStatus);
    const request = requests.find((r) => r.request_id === requestId);
    if (!request) return;

    if (normalized === "scheduled" && !extraData.schedule_date) {
      setPendingStatusChange({ requestId, status: normalized });
      setShowCalendarModal(true);
      return;
    }

    if (normalized === "completed" && request.tenant_id) {
      const result = await Swal.fire({
        title: "Record Expense?",
        text: "Would you like to add a maintenance expense?",
        icon: "question",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Yes, Add Expense",
        denyButtonText: "No, Just Complete",
        confirmButtonColor: "#3b82f6",
        denyButtonColor: "#6b7280",
      });
      if (result.isDismissed) return;
      if (result.isConfirmed) {
        setPendingStatusChange({ requestId, status: normalized });
        setShowExpenseModal(true);
        return;
      }
    }

    await performStatusUpdate(requestId, normalized, extraData);
  };

  const performStatusUpdate = async (
    requestId: number,
    status: string,
    extraData: Record<string, any> = {},
  ) => {
    const prev = [...requests];
    setRequests((r) =>
      r.map((x) =>
        x.request_id === requestId ? { ...x, status, ...extraData } : x,
      ),
    );

    try {
      const payload: any = {
        request_id: requestId,
        status,
        landlord_id: landlordId,
        user_id: user?.user_id,
        ...extraData,
      };
      if (status === "completed" && !extraData.completion_date)
        payload.completion_date = new Date().toISOString();
      await axios.put("/api/maintenance/updateStatus", payload);

      if (selectedRequest?.request_id === requestId) {
        setShowDetailsModal(false);
        setSelectedRequest(null);
      }

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Status: ${status}`,
        timer: 1500,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (err) {
      console.error("Error updating:", err);
      setRequests(prev);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleScheduleConfirm = async () => {
    if (!pendingStatusChange) return;
    await performStatusUpdate(pendingStatusChange.requestId, "scheduled", {
      schedule_date: selectedDate.toISOString(),
    });
    setShowCalendarModal(false);
    setPendingStatusChange(null);
  };

  const handleExpenseSaved = () => {
    if (pendingStatusChange) {
      setRequests((r) =>
        r.map((x) =>
          x.request_id === pendingStatusChange.requestId
            ? {
                ...x,
                status: "completed",
                completion_date: new Date().toISOString(),
              }
            : x,
        ),
      );
    }
    setShowExpenseModal(false);
    setPendingStatusChange(null);
  };

  const handleWorkOrderCreated = (newOrder: MaintenanceRequest) => {
    setRequests((prev) => [
      { ...newOrder, status: normalizeStatus(newOrder.status) },
      ...prev,
    ]);
    setShowNewModal(false);
    Swal.fire({
      icon: "success",
      title: "Created",
      timer: 1500,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  // Drag handlers (desktop only)
  const handleDragStart = (r: MaintenanceRequest) => setDraggedItem(r);
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const col = KANBAN_COLUMNS.find((c) => c.id === colId);
    if (!col || !draggedItem) return;
    const curr = getColumnForStatus(draggedItem.status);
    if (curr && col.acceptsFrom.includes(curr.id)) setDragOverColumn(colId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedItem) return;
    const target = KANBAN_COLUMNS.find((c) => c.id === colId);
    const curr = getColumnForStatus(draggedItem.status);
    if (!target || !curr || !target.acceptsFrom.includes(curr.id)) {
      setDraggedItem(null);
      return;
    }
    await updateRequestStatus(draggedItem.request_id, target.statuses[0]);
    setDraggedItem(null);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  // Filtering
  const filtered = requests
    .filter((r) => {
      const s = search.toLowerCase();
      return (
        r.subject?.toLowerCase().includes(s) ||
        r.property_name?.toLowerCase().includes(s) ||
        r.unit_name?.toLowerCase().includes(s)
      );
    })
    .filter((r) =>
      filterPriority
        ? r.priority_level?.toLowerCase() === filterPriority.toLowerCase()
        : true,
    )
    .filter((r) => {
      if (filterSource === "tenant") return !!r.tenant_id;
      if (filterSource === "landlord") return !r.tenant_id;
      return true;
    });

  const getColRequests = (col: KanbanColumnConfig) =>
    filtered.filter((r) => col.statuses.includes(r.status));
  const hasFilters = !!filterPriority || !!search || filterSource !== "all";
  const pendingCount = filtered.filter((r) => r.status === "pending").length;

  // Mobile tab selection
  const selectTab = (idx: number) => {
    setActiveColumnIndex(idx);
    const tabEl = tabScrollRef.current?.children[idx] as
      | HTMLElement
      | undefined;
    if (tabEl && tabScrollRef.current) {
      const container = tabScrollRef.current;
      const scrollLeft =
        tabEl.offsetLeft - container.offsetWidth / 2 + tabEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  };

  const activeColumn = KANBAN_COLUMNS[activeColumnIndex];
  const activeRequests = getColRequests(activeColumn);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-1" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-8 py-6">
          <div className="lg:hidden space-y-3">
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="hidden lg:grid lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div
      style={{ maxWidth: "100vw", overflowX: "hidden" }}
      className="bg-gray-50 min-h-screen"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white w-full"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 lg:px-8 lg:py-4 sticky top-14 lg:top-0 z-30">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:flex w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Wrench className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                    Work Orders
                  </h1>
                  <span className="text-[11px] sm:text-xs lg:text-sm text-gray-400">
                    {filtered.length} total
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[11px] sm:text-xs text-amber-600 font-medium">
                      · {pendingCount} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchRequests(true)}
                disabled={refreshing}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNewModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold text-sm shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>New Work Order</span>
              </motion.button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border transition-all flex-shrink-0 ${showFilters || hasFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Filters
              </span>
              {hasFilters && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none flex-1 sm:flex-none"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none flex-1 sm:flex-none"
                  >
                    <option value="all">All Sources</option>
                    <option value="tenant">Tenant Requests</option>
                    <option value="landlord">Work Orders</option>
                  </select>
                  {hasFilters && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilterPriority("");
                        setFilterSource("all");
                      }}
                      className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="hidden lg:block text-xs text-gray-400 mt-3">
            💡 Drag cards between columns or use action buttons to update
            status.
          </p>

          {/* Mobile tabs — inside header so sticky position is automatic */}
          <div className="lg:hidden mt-2 -mx-4 px-3 py-1.5 border-t border-gray-100">
            <div
              ref={tabScrollRef}
              className="flex overflow-x-auto scrollbar-hide gap-1.5"
            >
              {KANBAN_COLUMNS.map((col, idx) => {
                const count = getColRequests(col).length;
                const active = activeColumnIndex === idx;
                const Icon = col.Icon;
                return (
                  <button
                    key={col.id}
                    onClick={() => selectTab(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all flex-shrink-0 ${
                      active
                        ? `bg-gradient-to-r ${col.gradient} text-white shadow-sm`
                        : "bg-gray-100 text-gray-500 active:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{col.mobileLabel}</span>
                    <span
                      className={`min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full leading-none ${
                        active
                          ? "bg-white/25 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Board */}
        <div
          className="px-3 lg:px-6 py-2 lg:py-4 pb-24 lg:pb-8"
          style={{ maxWidth: "100%", overflowX: "hidden" }}
        >
          {/* Desktop kanban */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                requests={getColRequests(col)}
                onCardClick={(r) => {
                  setSelectedRequest(r);
                  setShowDetailsModal(true);
                }}
                onStatusChange={updateRequestStatus}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragOver={dragOverColumn === col.id}
                draggedItem={draggedItem}
              />
            ))}
          </div>

          {/* Mobile: tab-controlled single column */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeColumn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <KanbanColumn
                  column={activeColumn}
                  requests={activeRequests}
                  onCardClick={(r) => {
                    setSelectedRequest(r);
                    setShowDetailsModal(true);
                  }}
                  onStatusChange={updateRequestStatus}
                  isMobile
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNewModal(true)}
          className="sm:hidden fixed bottom-6 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        {/* Modals */}
        <AnimatePresence>
          {showCalendarModal && (
            <MaintenanceCalendarModal
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              handleScheduleConfirm={handleScheduleConfirm}
              onClose={() => {
                setShowCalendarModal(false);
                setPendingStatusChange(null);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showDetailsModal && selectedRequest && (
            <MaintenanceDetailsModal
              selectedRequest={selectedRequest}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedRequest(null);
              }}
              onStart={() => {
                setPendingStatusChange({
                  requestId: selectedRequest.request_id,
                  status: "scheduled",
                });
                setShowCalendarModal(true);
              }}
              onComplete={() =>
                updateRequestStatus(selectedRequest.request_id, "completed")
              }
              onReschedule={() => {
                setPendingStatusChange({
                  requestId: selectedRequest.request_id,
                  status: "scheduled",
                });
                setShowCalendarModal(true);
              }}
              updateStatus={updateRequestStatus}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showExpenseModal && pendingStatusChange && (
            <MaintenanceExpenseModal
              requestId={pendingStatusChange.requestId}
              userId={user?.user_id}
              onClose={() => {
                setShowExpenseModal(false);
                setPendingStatusChange(null);
              }}
              onSaved={handleExpenseSaved}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNewModal && (
            <NewWorkOrderModal
              landlordId={landlordId}
              onClose={() => setShowNewModal(false)}
              onCreated={handleWorkOrderCreated}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================
// KANBAN COLUMN
// ============================================
function KanbanColumn({
  column,
  requests,
  onCardClick,
  onStatusChange,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragOver,
  draggedItem,
  isMobile,
}: {
  column: KanbanColumnConfig;
  requests: MaintenanceRequest[];
  onCardClick: (r: MaintenanceRequest) => void;
  onStatusChange: (id: number, status: string, extra?: any) => void;
  onDragStart?: (r: MaintenanceRequest) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  draggedItem?: MaintenanceRequest | null;
  isMobile?: boolean;
}) {
  const Icon = column.Icon;
  const canAccept =
    draggedItem &&
    column.acceptsFrom.includes(
      getColumnForStatus(draggedItem.status)?.id || "",
    );

  return (
    <div
      className={`flex flex-col min-w-0 ${isMobile ? "" : "h-full"}`}
      onDragOver={(e) => onDragOver?.(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, column.id)}
    >
      <div
        className={`flex items-center justify-between p-2.5 lg:p-3 rounded-t-xl bg-gradient-to-r ${column.gradient}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/90" />
          <div>
            <h3 className="font-semibold text-white text-sm">{column.title}</h3>
            <p className="text-[10px] text-white/70 hidden lg:block">
              {column.subtitle}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-white text-xs font-semibold">
          {requests.length}
        </span>
      </div>
      <div
        className={`flex-1 p-2 lg:p-2.5 rounded-b-xl border-2 border-t-0 transition-all ${isDragOver && canAccept ? `${column.bgLight} border-dashed ${column.dotColor.replace("bg-", "border-")}` : "bg-gray-50/50 border-gray-100"}`}
      >
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 lg:py-8 text-gray-400 text-center">
            <div
              className={`w-10 h-10 rounded-xl ${column.bgLight} flex items-center justify-center mb-2`}
            >
              <Icon className={`w-5 h-5 ${column.textColor}`} />
            </div>
            <p className="text-sm font-medium">No requests</p>
            {canAccept && (
              <p className="text-xs mt-1 text-blue-500">Drop here</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {requests.map((r) => (
              <RequestCard
                key={r.request_id}
                request={r}
                column={column}
                onClick={() => onCardClick(r)}
                onStatusChange={onStatusChange}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// REQUEST CARD
// ============================================
function RequestCard({
  request,
  column,
  onClick,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isMobile,
}: {
  request: MaintenanceRequest;
  column: KanbanColumnConfig;
  onClick: () => void;
  onStatusChange: (id: number, status: string, extra?: any) => void;
  onDragStart?: (r: MaintenanceRequest) => void;
  onDragEnd?: () => void;
  isMobile?: boolean;
}) {
  const priority = getPriorityConfig(request.priority_level);
  const status = getStatusConfig(request.status);
  const isTenant = !!request.tenant_id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable={!isMobile}
      onDragStart={() => onDragStart?.(request)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all relative group active:scale-[0.98] overflow-hidden"
    >
      {!isMobile && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${priority.dot}`}
      />
      <div className="pl-2 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-gray-400 font-mono">
            #{request.request_id}
          </span>
          {isTenant && (
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
              Tenant
            </span>
          )}
        </div>
        <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
          {request.subject}
        </h4>
        {request.property_name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Home className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{request.property_name}</span>
            {request.unit_name && (
              <>
                <span className="text-gray-300">•</span>
                <span className="truncate">{request.unit_name}</span>
              </>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
          >
            {request.priority_level?.toLowerCase() === "urgent" && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
            {priority.label}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
            {request.category}
          </span>
          {(request.status === "completed" ||
            request.status === "rejected") && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${status.bgLight} ${status.text}`}
            >
              {status.shortLabel}
            </span>
          )}
        </div>
        {request.schedule_date && request.status !== "completed" && (
          <div className="flex items-center gap-1 text-xs text-purple-600 mb-2">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(request.schedule_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
      {column.nextActions.length > 0 && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
          {column.nextActions.map((a) => (
            <button
              key={a.status}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(request.request_id, a.status);
              }}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-white text-xs font-medium transition-all active:scale-95 ${a.color}`}
            >
              <ChevronRight className="w-3 h-3" />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
