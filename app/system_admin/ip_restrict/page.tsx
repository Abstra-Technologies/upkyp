"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

export default function IpRestrictionsPage() {
    const [ipList, setIpList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [ipAddress, setIpAddress] = useState("");
    const [label, setLabel] = useState("");

    // 🧩 Columns definition for MaterialReactTable
    const columns: MRT_ColumnDef<any>[] = [
        { accessorKey: "ip_address", header: "IP Address" },
        { accessorKey: "label", header: "Label" },
        { accessorKey: "added_by_admin_id", header: "Added By" },
        {
            accessorKey: "created_at",
            header: "Created At",
            Cell: ({ cell }) => new Date(cell.getValue() as string).toLocaleString(),
        },
    ];

    async function fetchIPs() {
        try {
            setLoading(true);
            const res = await axios.get("/api/systemadmin/ipRestrictions");

            if (res.data.success) {
                setIpList(res.data.data || []); // ✅ Correctly pass the array
                console.log("Fetched IPs:", res.data.data);
            } else {
                setIpList([]);
                Swal.fire("Error", res.data.message || "Failed to fetch IPs.", "error");
            }
        } catch (err) {
            console.error("Error fetching IPs:", err);
            Swal.fire("Error", "Failed to fetch IPs.", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchIPs();
    }, []);

    // ➕ Add IP
    async function addIP() {
        if (!ipAddress.trim()) {
            return Swal.fire("Error", "IP address cannot be empty.", "error");
        }

        try {
            await axios.post("/api/systemadmin/ipRestrictions", {
                ip_address: ipAddress.trim(),
                label: label.trim() || null,
            });
            Swal.fire("Success", "IP added successfully.", "success");
            setIpAddress("");
            setLabel("");
            fetchIPs();
        } catch (err) {
            Swal.fire("Error", "Failed to add IP.", "error");
        }
    }

    // 🗑️ Delete IP
    async function deleteIP(id: number, ip: string) {
        const confirm = await Swal.fire({
            title: "Remove IP?",
            text: `IP ${ip} will lose access to System Admin.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, remove it",
        });
        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`/api/systemadmin/ipRestrictions?id=${id}`);
            Swal.fire("Removed", "IP deleted successfully.", "success");
            fetchIPs();
        } catch (err) {
            Swal.fire("Error", "Failed to delete IP.", "error");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto bg-white shadow-md rounded-2xl p-6 border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    IP Restrictions
                </h1>
                <p className="text-gray-600 mb-6">
                    Manage IP addresses allowed to access the System Admin portal.
                </p>

                {/* ➕ Add New IP Form */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Enter IP address"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Label (optional)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={addIP}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
                    >
                        Add IP
                    </button>
                </div>

                {/* 📋 Table */}
                <div className="border rounded-lg shadow-sm overflow-hidden">
                    <MaterialReactTable
                        columns={columns}
                        data={ipList}
                        state={{ isLoading: loading }}
                        enableColumnActions={false}
                        enableColumnFilters={true}
                        enableSorting={true}
                        enablePagination={true}
                        enableRowActions
                        positionActionsColumn="last"
                        renderRowActions={({ row }) => (
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => deleteIP(row.original.id, row.original.ip_address)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
