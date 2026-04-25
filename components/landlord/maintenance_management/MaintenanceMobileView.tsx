"use client";

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

interface MaintenanceMobileViewProps {
    columns: KanbanColumnConfig[];
    requests: MaintenanceRequest[];
    activeColumnIndex: number;
    onTabChange: (idx: number) => void;
    onCardClick: (r: MaintenanceRequest) => void;
    onStatusChange: (id: number, status: string, extra?: any) => void;
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

    return (
        <div className="w-full flex flex-col -mx-3 px-3">
            {/* Tab Bar - Status Tabs */}
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-0 bg-gray-100 rounded-t-lg mx-[-12px] px-3">
                {columns.map((col, idx) => {
                    const count = getColRequests(col).length;
                    const active = activeColumnIndex === idx;
                    const Icon = col.Icon;

                    return (
                        <button
                            key={col.id}
                            onClick={() => onTabChange(idx)}
                            className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap rounded-t-lg border-b-2 min-h-[48px] ${
                                active
                                    ? "bg-white text-gray-900 border-blue-600 shadow-sm z-10"
                                    : `bg-gradient-to-r ${col.gradient} text-white border-transparent active:opacity-80 opacity-90`
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{col.mobileLabel}</span>
                            <span
                                className={`min-w-[18px] h-4 flex items-center justify-center text-[10px] font-bold rounded-full ${
                                    active
                                        ? "bg-gray-100 text-gray-600"
                                        : "bg-white/25 text-white"
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 p-4 min-h-[350px] -mx-3 px-3">
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-xl border border-gray-200 p-4 cursor-pointer active:scale-[0.98] transition-all overflow-hidden shadow-sm"
            onClick={onClick}
        >
            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${priority.dot}`} />
            <div className="pl-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 font-mono">
                        #{request.request_id}
                    </span>
                    {isTenant && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                            Tenant
                        </span>
                    )}
                </div>
                <h4 className="font-semibold text-gray-900 text-base leading-snug mb-3">
                    {request.subject}
                </h4>
                {request.property_name && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                        <Home className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{request.property_name}</span>
                        {request.unit_name && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="truncate">{request.unit_name}</span>
                            </>
                        )}
                    </div>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                    <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
                    >
                        {request.priority_level?.toLowerCase() === "urgent" && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        {priority.label}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {request.category}
                    </span>
                    {(request.status === "completed" || request.status === "rejected") && (
                        <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${status.bgLight} ${status.text}`}
                        >
                            {status.shortLabel}
                        </span>
                    )}
                </div>
                {request.schedule_date && request.status !== "completed" && (
                    <div className="flex items-center gap-1.5 text-sm text-purple-600 mb-3">
                        <Calendar className="w-4 h-4" />
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
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {column.nextActions.map((a) => (
                        <button
                            key={a.status}
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(request.request_id, a.status);
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${a.color}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
