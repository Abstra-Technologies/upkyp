"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    WrenchScrewdriverIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface MaintenanceRequest {
    request_id: number;
    agreement_id: string; // REQUIRED for redirect
    subject: string;
    description: string;
    property_name: string;
    unit_name: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    photo?: string | null;
}

export default function TenantMaintenanceWidget({
                                                    tenant_id,
                                                    maxItems = 3,
                                                }: {
    tenant_id?: string;
    maxItems?: number;
}) {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [displayedRequests, setDisplayedRequests] = useState<
        MaintenanceRequest[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const PLACEHOLDER_IMAGE = "/images/placeholders/no-image.png";

    useEffect(() => {
        if (!tenant_id) {
            setLoading(false);
            return;
        }

        const fetchMaintenanceRequests = async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/maintenance/getMaintenancebyTenantId?tenant_id=${tenant_id}`
                );


                if (!res.ok) {
                    throw new Error("Failed to fetch maintenance requests");
                }

                const data = await res.json();
                console.log('maintencne widget: ', data);

                const sorted = (data?.maintenance_requests || []).sort(
                    (a: MaintenanceRequest, b: MaintenanceRequest) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );

                setRequests(sorted);
                setDisplayedRequests(sorted.slice(0, maxItems));
            } catch (err: any) {
                setError(err.message || "Unable to load maintenance requests");
            } finally {
                setLoading(false);
            }
        };

        fetchMaintenanceRequests();
    }, [tenant_id, maxItems]);

    const getStatusConfig = (status: string) => {
        const configs = {
            pending: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                dot: "bg-red-500",
            },
            scheduled: {
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-200",
                dot: "bg-amber-500",
            },
            "in-progress": {
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-200",
                dot: "bg-blue-500",
            },
            in_progress: {
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-200",
                dot: "bg-blue-500",
            },
            completed: {
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-200",
                dot: "bg-emerald-500",
            },
        };

        return (
            configs[status.toLowerCase() as keyof typeof configs] || configs.pending
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "text-red-600";
            case "medium":
                return "text-amber-600";
            default:
                return "text-gray-700";
        }
    };

    const handleRedirect = (agreementId: string) => {
        router.push(
            `/tenant/rentalPortal/${agreementId}/maintenance`
        );
    };

    /* ------------------ LOADING ------------------ */
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="h-1 bg-gray-200 animate-pulse" />
                        <div className="p-3 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                            <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* ------------------ ERROR ------------------ */
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 font-semibold text-sm">{error}</p>
            </div>
        );
    }

    /* ------------------ EMPTY ------------------ */
    if (!requests.length) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <WrenchScrewdriverIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-sm">
                    No maintenance requests yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Your requests will appear here
                </p>
            </div>
        );
    }

    /* ------------------ MAIN ------------------ */
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                    Maintenance Requests
                </h2>
            </div>

            {/* List */}
            <div className="space-y-3">
                {displayedRequests.map((req) => {
                    const statusConfig = getStatusConfig(req.status);

                    return (
                        <button
                            key={req.request_id}
                            onClick={() => handleRedirect(req.agreement_id)}
                            className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Status Bar */}
                            <div
                                className={`h-1 ${
                                    req.status.toLowerCase() === "completed"
                                        ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                                        : req.status.toLowerCase() === "pending"
                                            ? "bg-red-400"
                                            : req.status.toLowerCase() === "scheduled"
                                                ? "bg-amber-400"
                                                : "bg-blue-400"
                                }`}
                            />

                            <div className="p-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                                        {req.subject}
                                    </h3>

                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                    >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                    />
                                        {req.status}
                  </span>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                    {req.description}
                                </p>

                                {/* Image */}
                                <div className="mb-3">
                                    <img
                                        src={req.photo || PLACEHOLDER_IMAGE}
                                        alt="Maintenance"
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                    />
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase">
                                            Property
                                        </p>
                                        <p className="text-xs font-medium truncate">
                                            {req.property_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase">
                                            Unit
                                        </p>
                                        <p className="text-xs font-medium truncate">
                                            {req.unit_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>
                    Priority:{" "}
                      <span
                          className={`font-semibold ${getPriorityColor(
                              req.priority
                          )}`}
                      >
                      {req.priority}
                    </span>
                  </span>

                                    <span>
                    {new Date(req.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                    })}
                  </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
