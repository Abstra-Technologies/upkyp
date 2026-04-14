"use client";
import { useEffect, useState } from "react";
import { Box, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import LeaseStatusInfo from "@/components/landlord/widgets/LeaseStatusInfo";
import useAuthStore from "@/zustand/authStore";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";

type Contact = {
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    property_name: string;
    unit_name: string;
    lease_status: string;
    agreement_id: number;
    agreement_url: string;
};

type RenewalRequest = {
    id: number;
    tenant_name: string;
    unit_name: string;
    requested_start_date: string;
    requested_end_date: string;
    status: string;
};

export default function LeaseContractsPage() {
    const { user } = useAuthStore();
    const [leases, setLeases] = useState<Contact[]>([]);
    const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 640px)");
    const itemsPerPage = 10;

    useEffect(() => {
        if (!user?.landlord_id) return;
        const fetchAll = async () => {
            try {
                const [leasesRes, renewRes] = await Promise.all([
                    fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${user.landlord_id}`),
                    fetch(`/api/landlord/properties/getRenewalRequest?landlord_id=${user.landlord_id}`)
                ]);
                setLeases(await leasesRes.json());
                setRenewals(await renewRes.json());
            } catch (err) {
                console.error("Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user?.landlord_id]);

    const handleView = (id: number) => router.push(`/pages/lease/${id}`);

    const start = (page - 1) * itemsPerPage;
    const visibleLeases = leases.slice(start, start + itemsPerPage);

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
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            const res = await fetch(`/api/landlord/properties/getRenewalRequest?landlord_id=${user?.landlord_id}`);
                                            const data = await res.json();
                                            setRenewals(data);
                                        } catch (err) {
                                            console.error("Failed to refresh renewal requests:", err);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <RefreshIcon color="primary" />
                                </IconButton>
                            </Tooltip>

                        </div>

                        {renewals.length === 0 ? (
                            <p className="text-sm text-gray-500">No renewal requests at the moment.</p>
                        ) : (
                            <div className="space-y-3">
                                {renewals
                                    // 🧩 Filter out processed renewals
                                    .filter((req) => req.status === "pending")
                                    .map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-3 hover:shadow-md transition-all"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {req.tenant_name} — {req.property_name} unit {req.unit_name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Requested {formatDate(req.requested_start_date)} →{" "}
                                                    {formatDate(req.requested_end_date)}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    Status: {req.status}
                                                </p>
                                            </div>

                                            {/* 🧩 Action buttons (only visible for pending requests) */}
                                            {req.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                setLoading(true);
                                                                const res = await fetch(`/api/leaseAgreement/updateRenewalStatus`, {
                                                                    method: "PUT",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ id: req.id, status: "approved" }),
                                                                });
                                                                if (!res.ok) throw new Error("Failed to approve request");
                                                                const updated = await res.json();

                                                                // 🧩 Update state and hide processed one
                                                                setRenewals((prev) =>
                                                                    prev.filter((r) => r.id !== req.id)
                                                                );
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Error approving renewal");
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium hover:opacity-90"
                                                    >
                                                        Approve
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                setLoading(true);
                                                                const res = await fetch(`/api/leaseAgreement/updateRenewalStatus`, {
                                                                    method: "PUT",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ id: req.id, status: "declined" }),
                                                                });
                                                                if (!res.ok) throw new Error("Failed to reject request");
                                                                const updated = await res.json();

                                                                // 🧩 Update state and hide processed one
                                                                setRenewals((prev) =>
                                                                    prev.filter((r) => r.id !== req.id)
                                                                );
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Error rejecting renewal");
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium hover:opacity-90"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {/* 🧩 Fallback if all processed */}
                                {renewals.filter((req) => req.status === "pending").length === 0 && (
                                    <p className="text-sm text-gray-500">No pending renewal requests.</p>
                                )}
                            </div>
                        )}



                    </div>
                </section>

                {/* 📋 Lease List */}
                <section>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        {loading ? (
                            <p className="text-gray-500">Loading leases...</p>
                        ) : leases.length === 0 ? (
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

                    {/* Pagination */}
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
