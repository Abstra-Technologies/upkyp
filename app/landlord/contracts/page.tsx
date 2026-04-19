"use client";

import { Box, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import LeaseStatusInfo from "@/components/landlord/widgets/LeaseStatusInfo";
import { formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";

import { useContractsPage } from "@/hooks/landlord/useContractsPage";

export default function LeaseContractsPage() {
    const {
        loading,
        leases,
        visibleLeases,
        pendingRenewals,
        page,
        setPage,
        itemsPerPage,
        refreshRenewals,
        handleView,
        handleApproveRenewal,
        handleRejectRenewal,
    } = useContractsPage();

    const isMobile = useMediaQuery("(max-width: 640px)");

    return (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <header className="mb-6">
                    <h1 className="gradient-header">Lease Contracts</h1>
                    <p className="text-gray-500 mt-1">
                        Easily manage your lease agreements and view renewal requests from tenants.
                    </p>
                </header>

                {/* 🧾 Renewal Requests Widget */}
                <section className="mt-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-800">Renewal Requests</h2>
                            <Tooltip title="Refresh">
                                <IconButton
                                    onClick={refreshRenewals}
                                >
                                    <RefreshIcon color="primary" />
                                </IconButton>
                            </Tooltip>

                        </div>

                        {pendingRenewals.length === 0 ? (
                            <p className="text-sm text-gray-500">No pending renewal requests.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingRenewals.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-3 hover:shadow-md transition-all"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {req.tenant_name} — unit {req.unit_name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Requested {formatDate(req.requested_start_date)} →{" "}
                                                {formatDate(req.requested_end_date)}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                Status: {req.status}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveRenewal(req.id)}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>

                                            <button
                                                onClick={() => handleRejectRenewal(req.id)}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 📋 Lease List */}
                <section>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        {loading ? (
                            <p className="text-gray-500">Loading leases...</p>
                        ) : visibleLeases.length === 0 ? (
                            <p className="text-gray-500">No active lease agreements found.</p>
                        ) : (
                            <div className={`${isMobile ? "space-y-4" : ""}`}>
                                {isMobile ? (
                                    visibleLeases.map((lease, i) => (
                                        <div
                                            key={i}
                                            className="p-4 border border-gray-100 rounded-xl shadow-sm bg-gradient-to-r from-white to-blue-50"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-semibold text-gray-800">
                                                    {lease.property_name} — {lease.unit_name}
                                                </p>
                                                <IconButton
                                                    onClick={() => handleView(lease.agreement_id)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Tenant: {lease.firstName} {lease.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Lease Status:{" "}
                                                <span
                                                    className={`font-semibold ${
                                                        lease.lease_status === "active"
                                                            ? "text-green-600"
                                                            : lease.lease_status === "pending"
                                                                ? "text-amber-600"
                                                                : "text-red-600"
                                                    }`}
                                                >
                                                  {lease.lease_status}
                                                </span>
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <table className="min-w-full text-sm text-left border-t">
                                        <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-2 px-4">Property / Unit</th>
                                            <th className="py-2 px-4">Tenant</th>
                                            <th className="py-2 px-4">Status</th>
                                            <th className="py-2 px-4">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {visibleLeases.map((lease) => (
                                            <tr
                                                key={lease.agreement_id}
                                                className="border-b hover:bg-blue-50 transition-all"
                                            >
                                                <td className="py-3 px-4 font-medium">
                                                    {lease.property_name} — {lease.unit_name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {lease.firstName} {lease.lastName}
                                                </td>
                                                <td className="py-3 px-4 capitalize">{lease.lease_status}</td>
                                                <td className="py-3 px-4">
                                                    <Tooltip title="View Lease">
                                                        <IconButton
                                                            onClick={() => handleView(lease.agreement_id)}
                                                            color="primary"
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(leases.length / itemsPerPage)}
                        totalItems={leases.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                    />
                </section>
            </div>
    );
}