"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle,
    CalendarClock,
    Play,
    Home,
    Calendar,
    ChevronRight,
} from "lucide-react";
import { getStatusConfig, getPriorityConfig } from "@/components/landlord/maintenance_management/getStatusConfig";

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

interface MaintenanceMobileViewProps {
    columns: KanbanColumnConfig[];
    requests: MaintenanceRequest[];
    activeColumnIndex: number;
    onTabChange: (idx: number) => void;
    onCardClick: (r: MaintenanceRequest) => void;
    onStatusChange: (id: string, status: string, extra?: any) => void;
    search: string;
    filterPriority: string;
    filterSource: "all" | "tenant" | "landlord";
}

export default function MaintenanceMobileView({
    columns,
    requests,
    activeColumnIndex,
    onTabChange,
    onCardClick,
    onStatusChange,
    search,
    filterPriority,
    filterSource,
}: MaintenanceMobileViewProps) {
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

    const activeColumn = columns[activeColumnIndex];
    const activeRequests = getColRequests(activeColumn);

    const [showAllTabs, setShowAllTabs] = useState(false);
    const visibleColumns = showAllTabs ? columns : columns.slice(0, 3);
    const hiddenCount = columns.length - 3;

    return (
        <div className="w-full flex flex-col">
            {/* Tab Bar - Grid Layout */}
            <div className="px-4 py-2">
                <div className="grid grid-cols-3 gap-1.5">
                    {visibleColumns.map((col, idx) => {
                        const originalIdx = columns.indexOf(col);
                        const count = getColRequests(col).length;
                        const active = activeColumnIndex === originalIdx;
                        const Icon = col.Icon;

                        return (
                            <button
                                key={col.id}
                                onClick={() => onTabChange(originalIdx)}
                                className={`flex items-center justify-center gap-1 px-1.5 py-1.5 text-[9px] font-semibold transition-all rounded-lg ${
                                    active
                                        ? `bg-gradient-to-r ${col.gradient} text-white shadow-md`
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                <Icon className="w-2.5 h-2.5" />
                                <span className="truncate">{col.mobileLabel}</span>
                                <span
                                    className={`min-w-[14px] h-3.5 flex items-center justify-center text-[8px] font-bold rounded-full ${
                                        active
                                            ? "bg-white/25 text-white"
                                            : "bg-gray-200 text-gray-500"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                    {hiddenCount > 0 && !showAllTabs && (
                        <button
                            onClick={() => setShowAllTabs(true)}
                            className="flex items-center justify-center gap-1 px-1.5 py-1.5 text-[9px] font-semibold rounded-lg bg-gray-100 text-gray-500"
                        >
                            +{hiddenCount} more
                        </button>
                    )}
                    {showAllTabs && (
                        <button
                            onClick={() => setShowAllTabs(false)}
                            className="flex items-center justify-center gap-1 px-1.5 py-1.5 text-[9px] font-semibold rounded-lg bg-red-50 text-red-500"
                        >
                            Less
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[350px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeColumn.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="space-y-4">
                            {activeRequests.map((r) => (
                                <MobileRequestCard
                                    key={r.request_id}
                                    request={r}
                                    column={activeColumn}
                                    onClick={() => onCardClick(r)}
                                    onStatusChange={onStatusChange}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function MobileRequestCard({
    request,
    column,
    onClick,
    onStatusChange,
}: {
    request: MaintenanceRequest;
    column: KanbanColumnConfig;
    onClick: () => void;
    onStatusChange: (id: number, status: string, extra?: any) => void;
}) {
    const priority = getPriorityConfig(request.priority_level);
    const status = getStatusConfig(request.status);
    const isTenant = !!request.tenant_id;

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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-lg p-2.5 cursor-pointer active:scale-[0.98] transition-all shadow-sm ${urgencyClasses}`}
            onClick={onClick}
        >
            <div className="flex items-start gap-2">
                <div className={`w-1 self-stretch rounded-full ${priority.dot}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-400 font-mono">#{request.request_id}</span>
                            {isTenant && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Tenant</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${priority.bg} ${priority.text}`}>
                                {priority.label}
                            </span>
                        </div>
                    </div>
                    <h4 className="font-medium text-gray-900 text-xs leading-tight line-clamp-1 mb-1">
                        {request.subject}
                    </h4>
                    {request.property_name && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                            <Home className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{request.property_name}</span>
                        </div>
                    )}
                </div>
            </div>
            {column.nextActions.length > 0 && (
                <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                    {column.nextActions.map((a) => (
                        <button
                            key={a.status}
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(request.request_id, a.status);
                            }}
                            className={`flex-1 flex items-center justify-center gap-0.5 px-2 py-1.5 rounded text-[9px] font-medium transition-all active:scale-95 ${a.color}`}
                        >
                            <ChevronRight className="w-2.5 h-2.5" />
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
