"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    X,
    Clock,
    CheckCircle,
    Play,
    CalendarClock,
    Check,
    Calendar,
    Ban,
    FileCheck,
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
import MaintenanceMobileView from "@/components/landlord/maintenance_management/MaintenanceMobileView";

// ============================================
// TYPES
// ============================================
interface MaintenanceRequest {
    request_id: string;
    subject: string;
    description?: string;
    status: string;
    priority_level: string;
    category: string;
    assigned_to?: string;
    schedule_date?: string;
    completion_date?: string;
    created_at: string;
    tenant_id?: string;
    tenant_first_name?: string;
    tenant_last_name?: string;
    property_id?: string;
    property_name?: string;
    unit_id?: string;
    unit_name?: string;
    photo_urls?: string[];
    column?: string;
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
// KANBAN COLUMNS CONFIG (Active)
// ============================================
const KANBAN_COLUMNS: KanbanColumnConfig[] = [
    {
        id: "pending",
        title: "PENDING",
        subtitle: "Awaiting review",
        statuses: ["pending"],
        gradient: "from-gray-700 to-gray-600",
        bgLight: "bg-gray-50",
        dotColor: "bg-gray-500",
        textColor: "text-gray-600",
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
        id: "to-be-scheduled",
        title: "TO BE SCHEDULED",
        subtitle: "Approved, awaiting date",
        statuses: ["approved"],
        gradient: "from-indigo-500 to-purple-500",
        bgLight: "bg-indigo-50",
        dotColor: "bg-indigo-500",
        textColor: "text-indigo-600",
        Icon: CalendarClock,
        acceptsFrom: ["pending"],
        mobileLabel: "To Schedule",
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
        title: "SCHEDULED",
        subtitle: "Date set, awaiting start",
        statuses: ["scheduled"],
        gradient: "from-cyan-500 to-blue-500",
        bgLight: "bg-cyan-50",
        dotColor: "bg-cyan-500",
        textColor: "text-cyan-600",
        Icon: Calendar,
        acceptsFrom: ["pending", "to-be-scheduled"],
        mobileLabel: "Scheduled",
        nextActions: [
            {
                label: "Start",
                status: "in-progress",
                color: "bg-blue-500 hover:bg-blue-600",
            },
        ],
    },
    {
        id: "in-progress",
        title: "IN PROGRESS",
        subtitle: "Work underway",
        statuses: ["in-progress"],
        gradient: "from-blue-600 to-blue-500",
        bgLight: "bg-blue-50",
        dotColor: "bg-blue-500",
        textColor: "text-blue-600",
        Icon: Play,
        acceptsFrom: ["scheduled"],
        mobileLabel: "In Progress",
        nextActions: [
            {
                label: "Complete",
                status: "completed",
                color: "bg-green-500 hover:bg-green-600",
            },
        ],
    },
];

const RESOLVED_COLUMNS: KanbanColumnConfig[] = [
    {
        id: "completed",
        title: "COMPLETED",
        subtitle: "Work finished",
        statuses: ["completed"],
        gradient: "from-green-500 to-emerald-500",
        bgLight: "bg-green-50",
        dotColor: "bg-green-500",
        textColor: "text-green-600",
        Icon: CheckCircle,
        acceptsFrom: [],
        mobileLabel: "Completed",
        nextActions: [],
    },
    {
        id: "rejected",
        title: "REJECTED",
        subtitle: "Request declined",
        statuses: ["rejected"],
        gradient: "from-red-500 to-rose-500",
        bgLight: "bg-red-50",
        dotColor: "bg-red-500",
        textColor: "text-red-600",
        Icon: Ban,
        acceptsFrom: [],
        mobileLabel: "Rejected",
        nextActions: [],
    },
];

const getColumnForStatus = (status: string) => {
    const normalized = normalizeStatus(status);
    const allColumns = [...KANBAN_COLUMNS, ...RESOLVED_COLUMNS];
    return allColumns.find((col) => col.statuses.includes(normalized));
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
        column: item.column,
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
    const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");

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

    const getColRequests = (col: KanbanColumnConfig) => {
        return filtered.filter((r) => col.statuses.includes(r.status));
    };
    const hasFilters = !!filterPriority || !!search || filterSource !== "all";
    const pendingCount = filtered.filter((r) => r.status === "pending").length;

    const activeColumns = activeTab === "active" ? KANBAN_COLUMNS : RESOLVED_COLUMNS;
    const activeCount = filtered.filter((r) => ["pending", "approved", "scheduled", "in-progress"].includes(r.status)).length;
    const resolvedCount = filtered.filter((r) => ["completed", "rejected"].includes(r.status)).length;

    if (loading)
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b px-4 py-4 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                        <div>
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-1" />
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="px-4 md:px-8 py-6">
                    <div className="md:hidden space-y-3">
                        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                    </div>
                    <div className="hidden md:grid md:grid-cols-5 gap-4">
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
            className="bg-[#f0f2f5] min-h-screen"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white w-full"
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-b border-gray-200 px-6 py-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Maintenance
                            </h1>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === "active"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            onClick={() => setActiveTab("resolved")}
                            className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === "resolved"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Resolved ({resolvedCount})
                        </button>
                    </div>
                </motion.div>

                {/* Board Header */}
                <div className="hidden md:block px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Request Board
                            </h2>
                            <span className="text-sm text-gray-500">
                                {filtered.length} total
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search tenants"
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-64"
                                />
                            </div>
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Create Work Order
                            </button>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className={`grid gap-4 ${activeTab === "active" ? "grid-cols-4" : "grid-cols-2"}`}>
                        {activeColumns.map((col) => (
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
                                setShowCalendarModal={setShowCalendarModal}
                                setShowExpenseModal={setShowExpenseModal}
                                setPendingStatusChange={setPendingStatusChange}
                            />
                        ))}
                    </div>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden -mx-3">
                    <div className="px-3 mb-3">
                        <div className="relative min-w-0">
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
                    </div>
                    <MaintenanceMobileView
                        columns={KANBAN_COLUMNS}
                        requests={filtered}
                        activeColumnIndex={activeColumnIndex}
                        onTabChange={setActiveColumnIndex}
                        onCardClick={(r) => {
                            setSelectedRequest(r);
                            setShowDetailsModal(true);
                        }}
                        onStatusChange={updateRequestStatus}
                        search={search}
                        filterPriority={filterPriority}
                        filterSource={filterSource}
                    />
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
    setShowCalendarModal,
    setShowExpenseModal,
    setPendingStatusChange,
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
    setShowCalendarModal: (v: boolean) => void;
    setShowExpenseModal: (v: boolean) => void;
    setPendingStatusChange: (v: { requestId: number; status: string } | null) => void;
}) {
    const Icon = column.Icon;
    const canAccept =
        draggedItem &&
        column.acceptsFrom.includes(
            getColumnForStatus(draggedItem.status)?.id || "",
        );

    return (
        <div
            className="flex flex-col min-w-0 rounded-xl bg-[#f5f6f8]"
            onDragOver={(e) => onDragOver?.(e, column.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, column.id)}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                        {column.title}
                    </h3>
                </div>
                <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-600 text-xs font-medium">
                    {requests.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center">
                        <p className="text-sm">No requests</p>
                    </div>
                ) : (
                    requests.map((r) => (
                        <RequestCard
                            key={r.request_id}
                            request={r}
                            column={column}
                            onClick={() => onCardClick(r)}
                            onStatusChange={onStatusChange}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            setShowCalendarModal={setShowCalendarModal}
                            setShowExpenseModal={setShowExpenseModal}
                            setPendingStatusChange={setPendingStatusChange}
                        />
                    ))
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
    setShowCalendarModal,
    setShowExpenseModal,
    setPendingStatusChange,
}: {
    request: MaintenanceRequest;
    column: KanbanColumnConfig;
    onClick: () => void;
    onStatusChange: (id: number, status: string, extra?: any) => void;
    onDragStart?: (r: MaintenanceRequest) => void;
    onDragEnd?: () => void;
    setShowCalendarModal: (v: boolean) => void;
    setShowExpenseModal: (v: boolean) => void;
    setPendingStatusChange: (v: { requestId: number; status: string } | null) => void;
}) {
    const tenantName = request.tenant_first_name
        ? `${request.tenant_first_name} ${request.tenant_last_name || ""}`.trim()
        : "Unassigned";
    const initial = tenantName.charAt(0).toUpperCase();

    const p = request.priority_level?.toLowerCase();
    const isUrgent = p === "urgent";
    const isHigh = p === "high";
    const isMedium = p === "medium";

    const urgencyClasses = isUrgent
        ? "border-l-4 border-l-red-500 border-t border-r border-b border-red-200 bg-red-50/40"
        : isHigh
            ? "border-l-4 border-l-orange-500 border-t border-r border-b border-orange-200 bg-orange-50/30"
            : isMedium
                ? "border-l-4 border-l-blue-400 border-t border-r border-b border-blue-200 bg-blue-50/20"
                : "border-l-4 border-l-green-400 border-t border-r border-b border-green-200 bg-green-50/10";

    const urgencyBadge = isUrgent
        ? { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Urgent" }
        : isHigh
            ? { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", label: "High" }
            : isMedium
                ? { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400", label: "Normal" }
                : { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-400", label: "Low" };

    const avatarGradient = isUrgent
        ? "from-red-500 to-red-600"
        : isHigh
            ? "from-orange-500 to-orange-600"
            : isMedium
                ? "from-blue-400 to-blue-500"
                : "from-green-400 to-green-500";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            draggable
            onDragStart={() => onDragStart?.(request)}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={`rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all relative group ${urgencyClasses}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">
                    #{request.request_id}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${urgencyBadge.bg} ${urgencyBadge.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${urgencyBadge.dot}`} />
                    {urgencyBadge.label}
                </span>
            </div>

            <h4 className="font-medium text-gray-900 text-sm leading-snug mb-3 line-clamp-2">
                {request.subject}
            </h4>

            <p className="text-sm text-gray-500 mb-3">
                {request.property_name || "Luxury Apartment"}
            </p>

            <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-medium shadow-sm flex-shrink-0`}>
                        {initial}
                    </div>
                    <span className="text-sm text-gray-700 font-medium truncate">
                        {tenantName}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {column.nextActions.map((action) => (
                        <button
                            key={action.status}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (action.needsDate) {
                                    setPendingStatusChange({ requestId: Number(request.request_id), status: action.status });
                                    setShowCalendarModal(true);
                                } else if (action.status === "completed" && request.tenant_id) {
                                    const handleComplete = async (withExpense: boolean) => {
                                        if (withExpense) {
                                            setPendingStatusChange({ requestId: Number(request.request_id), status: action.status });
                                            setShowExpenseModal(true);
                                        } else {
                                            await onStatusChange(Number(request.request_id), action.status, {
                                                completion_date: new Date().toISOString(),
                                            });
                                        }
                                    };
                                    Swal.fire({
                                        title: "Record Expense?",
                                        text: "Would you like to add a maintenance expense?",
                                        icon: "question",
                                        showDenyButton: true,
                                        showCancelButton: true,
                                        confirmButtonText: "Yes, Add Expense",
                                        denyButtonText: "No, Just Complete",
                                        confirmButtonColor: "#3b82f6",
                                        denyButtonColor: "#6b7280",
                                    }).then((result) => {
                                        if (result.isConfirmed) handleComplete(true);
                                        else if (result.isDenied) handleComplete(false);
                                    });
                                } else {
                                    onStatusChange(Number(request.request_id), action.status);
                                }
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${action.color} text-white text-[10px] font-semibold rounded-lg transition-all hover:scale-105 active:scale-95`}
                        >
                            {action.status === "approved" && <Check className="w-3 h-3" />}
                            {action.status === "scheduled" && <Calendar className="w-3 h-3" />}
                            {action.status === "in-progress" && <Play className="w-3 h-3" />}
                            {action.status === "completed" && <FileCheck className="w-3 h-3" />}
                            {action.status === "rejected" && <Ban className="w-3 h-3" />}
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}