"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function PropertyPayoutAssignment({ propertyId }: any) {

    const [accounts, setAccounts] = useState<any[]>([]);
    const [assigned, setAssigned] = useState<any>(null);
    const [selected, setSelected] = useState("");

    /* ======================
       FETCH DATA
    ====================== */
    const fetchData = async () => {
        try {
            const [accRes, assignedRes] = await Promise.all([
                axios.get("/api/landlord/payout/getAllAccount"),
                axios.get(`/api/landlord/payout/getPropertyPayout?property_id=${propertyId}`)
            ]);

            const accountsData = Array.isArray(accRes.data)
                ? accRes.data
                : accRes.data?.accounts || [];

            setAccounts(accountsData);
            setAssigned(assignedRes.data || null);

        } catch (err) {
            console.error(err);
            setAccounts([]);
        }
    };

    useEffect(() => {
        if (propertyId) fetchData();
    }, [propertyId]);

    /* ======================
       ASSIGN
    ====================== */
    const handleAssign = async () => {
        if (!selected) return;

        try {
            await axios.post("/api/landlord/payout/assignProperty", {
                payout_id: selected,
                property_id: propertyId,
            });

            await Swal.fire("Assigned", "Payout account linked", "success");

            fetchData();
            setSelected("");

        } catch (err) {
            Swal.fire("Error", "Failed to assign", "error");
        }
    };

    /* ======================
       REMOVE
    ====================== */
    const handleRemove = async () => {
        if (!assigned) return;

        const confirm = await Swal.fire({
            title: "Remove payout?",
            text: "This will unlink the property from this account",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete("/api/landlord/payout/deassignProperty", {
                data: {
                    payout_id: assigned.payout_id,
                    property_id: propertyId,
                },
            });

            await Swal.fire("Removed", "Unlinked successfully", "success");

            setAssigned(null);

        } catch (err) {
            Swal.fire("Error", "Failed to remove", "error");
        }
    };

    return (
        <div className="
            bg-gradient-to-br from-emerald-100 via-white to-emerald-50
            rounded-2xl
            p-4 sm:p-5
            border border-emerald-200
            shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),inset_-1px_-1px_0_rgba(16,185,129,0.08),0_6px_16px_rgba(0,0,0,0.08)]
            space-y-4
        ">

            {/* HEADER */}
            <div>
                <h3 className="font-semibold text-gray-900">
                    Bank Account Link
                </h3>
                <p className="text-xs text-gray-600">
                    Set where payments for this property will be sent.
                </p>
            </div>

            {/* CURRENT ASSIGNED */}
            {assigned ? (
                <div className="
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-3
                    border border-emerald-100
                    rounded-xl
                    p-3
                    bg-white/70 backdrop-blur-sm
                ">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {assigned.account_name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {assigned.bank_name} • {assigned.account_number}
                        </p>
                    </div>

                    <button
                        onClick={handleRemove}
                        className="
                            text-xs px-3 py-1.5
                            bg-red-100 text-red-700
                            hover:bg-red-200
                            rounded-md
                            transition
                            self-start sm:self-auto
                        "
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <div className="text-sm text-gray-500 bg-white/60 rounded-lg p-3">
                    No payout account assigned
                </div>
            )}

            {/* ASSIGN SECTION */}
            <div className="flex flex-col sm:flex-row gap-2">

                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="
                        flex-1
                        border border-gray-200
                        rounded-lg
                        px-3 py-2 text-sm
                        bg-white
                        focus:outline-none focus:ring-2 focus:ring-emerald-400
                    "
                >
                    <option value="">Select payout account</option>

                    {Array.isArray(accounts) && accounts.map((a: any) => (
                        <option key={a.payout_id} value={a.payout_id}>
                            {a.account_name} ({a.bank_name})
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleAssign}
                    disabled={!selected}
                    className="
                        px-4 py-2
                        bg-emerald-600 text-white
                        hover:bg-emerald-700
                        disabled:opacity-50
                        rounded-lg text-sm font-medium
                        transition
                    "
                >
                    Assign
                </button>
            </div>

        </div>
    );
}