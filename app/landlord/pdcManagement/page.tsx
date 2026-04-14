"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { BackButton } from "@/components/navigation/backButton";
import {
    Upload,
    Eye,
    CheckCircle,
    XCircle,
    RefreshCcw,
    User,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import PDCUploadModal from "@/components/landlord/pdc/PDCUploadModal";
import useAuthStore from "@/zustand/authStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import { listingLimits } from "@/constant/subscription/limits";

export default function PDCManagementPage() {
    const { user } = useAuthStore();
    const landlord_id = user?.landlord_id;
    const { subscription, loading: loadingSubscription } = useSubscription(landlord_id);

    const [pdcList, setPdcList] = useState<any[]>([]);
    const [totalPDCCount, setTotalPDCCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPDC, setSelectedPDC] = useState<any>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const fetchPDCs = async () => {
        if (!landlord_id) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("landlord_id", landlord_id);
            params.append("page", pagination.page.toString());
            params.append("limit", pagination.limit.toString());
            if (filterStatus !== "all") params.append("status", filterStatus);

            const { data } = await axios.get(`/api/landlord/pdc/getAll?${params.toString()}`);
            setPdcList(data.data || []);
            setTotalPDCCount(data.totalCount || 0); // Set total PDC count
            setPagination((prev) => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 1,
            }));
        } catch (error: any) {
            console.error("Failed to fetch PDCs:", error.message);
            Swal.fire("Error", error.response?.data?.error || "Failed to fetch PDCs.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPDCs();
    }, [landlord_id, filterStatus, pagination.page, pagination.limit]);


    const handleMarkStatus = async (pdc_id: number, status: "cleared" | "bounced") => {
        const confirm = await Swal.fire({
            title: `Mark as ${status}?`,
            text: `This will update the status of PDC #${pdc_id}.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: `Yes, mark as ${status}`,
        });
        if (!confirm.isConfirmed) return;

        try {
            await axios.put("/api/landlord/pdc/updateStatus", { pdc_id, status });
            Swal.fire("Updated!", `PDC #${pdc_id} marked as ${status}.`, "success");
            fetchPDCs();
        } catch {
            Swal.fire("Error", "Failed to update PDC status.", "error");
        }
    };

    const columns = useMemo<MRT_ColumnDef<any>[]>(
        () => [
            { accessorKey: "check_number", header: "Check #" },
            { accessorKey: "bank_name", header: "Bank" },
            {
                accessorKey: "tenant_name",
                header: "Tenant",
                Cell: ({ cell }) => (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>{cell.getValue<string>() || "Unknown"}</span>
                    </div>
                ),
            },
            {
                accessorKey: "amount",
                header: "Amount",
                Cell: ({ cell }) => (
                    <span className="text-blue-700 font-semibold">
                        {formatCurrency(cell.getValue<number>())}
                    </span>
                ),
            },
            {
                accessorKey: "due_date",
                header: "Issue Date",
                Cell: ({ cell }) => (
                    <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="w-4 h-4 text-emerald-500" />
                        {formatDate(cell.getValue<string>())}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                Cell: ({ cell }) => {
                    const status = cell.getValue<string>();
                    const colorMap: Record<string, string> = {
                        pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
                        cleared: "bg-green-50 text-green-700 border-green-200",
                        bounced: "bg-red-50 text-red-700 border-red-200",
                        replaced: "bg-gray-50 text-gray-700 border-gray-200",
                    };
                    return (
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                colorMap[status] || "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                        >
                            {status}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                Cell: ({ row }) => {
                    const pdc = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setSelectedPDC(pdc);
                                    setViewModalOpen(true);
                                }}
                                title="View Details"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            {pdc.status === "pending" && (
                                <>
                                    <button
                                        onClick={() => handleMarkStatus(pdc.pdc_id, "cleared")}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                        title="Mark as Cleared"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMarkStatus(pdc.pdc_id, "bounced")}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Mark as Bounced"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            {pdc.status === "bounced" && (
                                <button
                                    onClick={() =>
                                        Swal.fire("Replacement", "Feature coming soon", "info")
                                    }
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Upload Replacement"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* HEADER SECTION */}
                <div className="flex flex-col gap-5 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <BackButton label="Back to Dashboard" />
                            <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-gray-800">
                                Post-Dated Check Management
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Manage all post-dated checks uploaded under your lease agreements.
                            </p>
                        </div>

                        {/* Upload Button */}
                        {/* Upload Button */}
                        <button
                            onClick={() => {
                                if (loadingSubscription) return;
                                if (!subscription) {
                                    Swal.fire({
                                        title: "Subscription Required",
                                        text: "You need an active subscription to use PDC management.",
                                        icon: "warning",
                                    });
                                    return;
                                }
                                if (subscription.plan_name === "Free Plan") {
                                    Swal.fire({
                                        title: "Feature Unavailable",
                                        text: "Post-Dated Checks are not available for Free Plan users. Upgrade to access this feature.",
                                        icon: "info",
                                    });
                                    return;
                                }
                                setIsModalOpen(true);
                            }}
                            disabled={loadingSubscription || subscription?.plan_name === "Free Plan"}
                            className={`inline-flex items-center px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-md ${
                                loadingSubscription || subscription?.plan_name === "Free Plan"
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg"
                            }`}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New PDC
                        </button>

                    </div>

                </div>

                {/* ✅ Status Filter Bar */}
                <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    {["all", "pending", "cleared", "bounced", "replaced"].map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setFilterStatus(status);
                                setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === status
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading PDCs...</div>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <MaterialReactTable
                                    columns={columns}
                                    data={pdcList}
                                    enableColumnResizing
                                    enableSorting
                                    enableGlobalFilter
                                    manualPagination
                                    rowCount={pagination.total}
                                    state={{ pagination: { pageIndex: pagination.page - 1, pageSize: pagination.limit } }}
                                    onPaginationChange={(updater) => {
                                        const newPagination = updater({
                                            pageIndex: pagination.page - 1,
                                            pageSize: pagination.limit,
                                        });
                                        setPagination({
                                            ...pagination,
                                            page: newPagination.pageIndex + 1,
                                            limit: newPagination.pageSize,
                                        });
                                    }}
                                    muiTablePaperProps={{
                                        elevation: 0,
                                        sx: { borderRadius: "12px" },
                                    }}
                                />
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-3">
                                {pdcList.map((pdc) => (
                                    <div
                                        key={pdc.pdc_id}
                                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                                    >
                                        <div className="flex justify-between">
                                            <h3 className="font-semibold text-gray-800">
                                                Check #{pdc.check_number}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                                    pdc.status === "pending"
                                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                        : pdc.status === "cleared"
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-red-50 text-red-700 border-red-200"
                                                }`}
                                            >
                                                {pdc.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {pdc.bank_name} • {formatCurrency(pdc.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Due {formatDate(pdc.due_date)}
                                        </p>
                                        <div className="flex justify-end mt-3 gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPDC(pdc);
                                                    setViewModalOpen(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {pdc.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleMarkStatus(pdc.pdc_id, "cleared")}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkStatus(pdc.pdc_id, "bounced")}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Mobile Pagination */}
                                <div className="flex items-center justify-between mt-4">
                                    <button
                                        onClick={() =>
                                            setPagination((prev) => ({
                                                ...prev,
                                                page: Math.max(prev.page - 1, 1),
                                            }))
                                        }
                                        disabled={pagination.page === 1}
                                        className={`p-2 rounded-lg ${
                                            pagination.page === 1
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-blue-600 hover:bg-blue-50"
                                        }`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setPagination((prev) => ({
                                                ...prev,
                                                page: Math.min(prev.page + 1, pagination.totalPages),
                                            }))
                                        }
                                        disabled={pagination.page === pagination.totalPages}
                                        className={`p-2 rounded-lg ${
                                            pagination.page === pagination.totalPages
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-blue-600 hover:bg-blue-50"
                                        }`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Upload Modal */}
                <PDCUploadModal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        fetchPDCs();
                    }}
                    landlord_id={landlord_id}
                />

                {/* View Details Modal */}
                {viewModalOpen && selectedPDC && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                            >
                                ✕
                            </button>

                            <h2 className="text-xl font-bold text-gray-800 mb-4">Check Details</h2>

                            <div className="space-y-2 text-sm text-gray-700">
                                <p>
                                    <strong>Check #:</strong> {selectedPDC.check_number}
                                </p>
                                <p>
                                    <strong>Bank:</strong> {selectedPDC.bank_name}
                                </p>
                                <p>
                                    <strong>Amount:</strong> {formatCurrency(selectedPDC.amount)}
                                </p>
                                <p>
                                    <strong>Issue Date:</strong> {formatDate(selectedPDC.due_date)}
                                </p>
                                <p>
                                    <strong>Status:</strong> {selectedPDC.status}
                                </p>
                                <p>
                                    <strong>Notes:</strong> {selectedPDC.notes || "—"}
                                </p>

                                {selectedPDC.uploaded_image_url && (
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-600 mb-1 font-medium">Check Image:</p>
                                        <img
                                            src={selectedPDC.uploaded_image_url}
                                            alt="PDC Check"
                                            className="w-full rounded-lg border border-gray-200 cursor-zoom-in hover:brightness-95 transition"
                                            onClick={() =>
                                                Swal.fire({
                                                    html: `
                            <img src="${selectedPDC.uploaded_image_url}" 
                              alt="Zoomed Check"
                              style="max-height:80vh; border-radius:12px; box-shadow:0 0 20px rgba(0,0,0,0.2);" />`,
                                                    background: "rgba(0,0,0,0.85)",
                                                    showConfirmButton: false,
                                                    showCloseButton: true,
                                                    width: "auto",
                                                    padding: 0,
                                                })
                                            }
                                        />
                                        <p className="text-xs text-gray-400 mt-1 text-center">
                                            Click to zoom
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}