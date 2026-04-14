"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import {
    CalendarDays,
    ArrowLeft,
    Loader2,
    RefreshCcw,
    FileText,
} from "lucide-react";

export default function ExtendOrRenewLeasePage() {
    const router = useRouter();
    const params = useParams() as {
        id?: string;
        agreement_id?: string;
    };

    const { id, agreement_id } = params;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lease, setLease] = useState<any>(null);

    const [newEndDate, setNewEndDate] = useState("");
    const [newRent, setNewRent] = useState("");

    /* ===============================
       GUARD
    ================================ */
    if (!agreement_id) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <p className="text-red-600 text-sm">
                    Invalid lease reference.
                </p>
            </div>
        );
    }

    /* ===============================
       FETCH LEASE (API-ALIGNED)
    ================================ */
    useEffect(() => {
        const fetchLease = async () => {
            try {
                const res = await axios.get(
                    "/api/landlord/activeLease/getByAgreementId",
                    { params: { agreement_id } }
                );

                setLease(res.data);

                if (res.data?.end_date) {
                    const d = new Date(res.data.end_date);
                    d.setFullYear(d.getFullYear() + 1);
                    setNewEndDate(d.toISOString().split("T")[0]);
                }
            } catch {
                Swal.fire("Error", "Failed to load lease data.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchLease();
    }, [agreement_id]);

    /* ===============================
       MODE (FROM lease_status)
    ================================ */
    const mode = useMemo<"extend" | "renew" | "blocked">(() => {
        if (!lease?.lease_status) return "blocked";

        if (["expired", "completed"].includes(lease.lease_status))
            return "renew";

        if (lease.lease_status === "active") return "extend";

        return "blocked";
    }, [lease]);

    /* ===============================
       SUBMIT
    ================================ */
    const handleSubmit = async () => {
        if (!newEndDate) {
            Swal.fire("Missing field", "Select a new end date.", "warning");
            return;
        }

        setSubmitting(true);

        try {
            await axios.post("/api/landlord/activeLease/extend", {
                agreement_id,
                new_end_date: newEndDate,
                new_rent_amount: newRent || null,
            });

            Swal.fire({
                title: mode === "renew" ? "Lease Renewed" : "Lease Extended",
                icon: "success",
                confirmButtonColor: "#059669",
            }).then(() => {
                router.push(`/pages/landlord/properties/${id}/activeLease`);
            });
        } catch {
            Swal.fire("Error", "Failed to process lease.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ===============================
       LOADING
    ================================ */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <p className="text-gray-600 text-sm">Loading lease details…</p>
            </div>
        );
    }

    /* ===============================
       BLOCKED STATE
    ================================ */
    if (mode === "blocked") {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <p className="text-gray-600 text-sm">
                    This lease cannot be extended or renewed.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-8">
            <div className="max-w-lg mx-auto bg-white border rounded-2xl shadow-lg p-6">

                {/* BACK */}
                <button
                    onClick={() =>
                        router.push(`/pages/landlord/properties/${id}/activeLease`)
                    }
                    className="flex items-center text-sm text-gray-600 mb-4 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Leases
                </button>

                {/* HEADER */}
                <div className="flex items-center gap-2 mb-6">
                    {mode === "renew" ? (
                        <RefreshCcw className="w-6 h-6 text-indigo-600" />
                    ) : (
                        <CalendarDays className="w-6 h-6 text-emerald-600" />
                    )}
                    <h1 className="text-xl font-bold">
                        {mode === "renew" ? "Renew Lease" : "Extend Lease"}
                    </h1>
                </div>

                {/* SUMMARY (API FIELDS) */}
                <div className="bg-gray-50 border rounded-xl p-4 text-sm mb-6 space-y-1">
                    <p><strong>Property:</strong> {lease.property_name}</p>
                    <p><strong>Unit:</strong> {lease.unit_name}</p>
                    <p><strong>Tenant:</strong> {lease.tenant_name}</p>
                    <p>
                        <strong>Current End Date:</strong>{" "}
                        {lease.end_date?.split("T")[0]}
                    </p>
                    <p>
                        <strong>Rent:</strong> ₱
                        {Number(lease.rent_amount || 0).toLocaleString()}
                    </p>
                </div>

                {/* DOCUMENT */}
                {lease.agreement_url && (
                    <a
                        href={lease.agreement_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 mb-6 hover:underline"
                    >
                        <FileText className="w-4 h-4" />
                        View Lease Document
                    </a>
                )}

                {/* FORM */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            New End Date
                        </label>
                        <input
                            type="date"
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            New Rent (optional)
                        </label>
                        <input
                            type="number"
                            value={newRent}
                            onChange={(e) => setNewRent(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                    >
                        {submitting
                            ? "Processing…"
                            : mode === "renew"
                                ? "Confirm Renewal"
                                : "Confirm Extension"}
                    </button>

                    <button
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${id}/activeLease`)
                        }
                        className="w-full px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
