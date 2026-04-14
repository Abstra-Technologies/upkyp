"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdPersonAddDisabled } from "react-icons/md";
import authStore from "../../../../zustand/authStore";
import EditModal from "../../../../components/systemAdmin/editAdmin";
import { logEvent } from "../../../..//utils/gtag";
import LoadingScreen from "../../../../components/loadingScreen";
import Swal from "sweetalert2";

export default function CoAdminDashboard() {
    const { admin } = authStore();
    const router = useRouter();

    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editModal, setEditModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        role: "",
        status: "",
        password: "",
        permissions: [] as string[],
    });

    /* ================= FETCH ADMINS ================= */
    useEffect(() => {
        if (!admin) return;

        const fetchAdmins = async () => {
            try {
                const res = await fetch(
                    "/api/systemadmin/co_admin/getAllAdmins",
                    { credentials: "include" }
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to load admins");
                setAdmins(data.admins || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, [admin]);

    /* ================= EDIT ================= */
    const handleEdit = async (admin_id: string) => {
        try {
            const res = await fetch(
                `/api/systemadmin/co_admin/getAdminDetail/${admin_id}`,
                { credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSelectedAdmin(admin_id);
            setFormData({
                username: data.admin.username,
                email: data.admin.email,
                role: data.admin.role,
                status: data.admin.status,
                password: "",
                permissions: data.admin.permissions || [],
            });

            setEditModal(true);
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    /* ================= STATUS ================= */
    const handleStatusChange = async (admin_id: string, status: string) => {
        try {
            await fetch(
                `/api/systemadmin/co_admin/updateAccountStatus/${admin_id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            setAdmins((prev) =>
                prev.map((a) =>
                    a.admin_id === admin_id ? { ...a, status } : a
                )
            );

            Swal.fire("Success", "Status updated", "success");
        } catch {
            Swal.fire("Error", "Failed to update status", "error");
        }
    };

    /* ================= UPDATE ================= */
    const handleUpdate = async () => {
        try {
            const res = await fetch(
                `/api/systemadmin/co_admin/details/${selectedAdmin}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(formData),
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            if (!res.ok) throw new Error("Update failed");

            setAdmins((prev) =>
                prev.map((a) =>
                    a.admin_id === selectedAdmin
                        ? {
                            ...a,
                            username: formData.username,
                            email: formData.email,
                            status: formData.status,
                            permissions: formData.permissions,
                        }
                        : a
                )
            );

            setEditModal(false);
            Swal.fire("Success", "Co-admin updated", "success");
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    /* ================= PERMISSIONS ================= */
    const handlePermissionChange = (e: any) => {
        const { checked, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, value]
                : prev.permissions.filter((p) => p !== value),
        }));
    };

    if (loading) return <LoadingScreen />;
    if (error) return <p className="p-6 text-red-500">{error}</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold text-blue-600 mb-6">
                Co-Admin Management
            </h1>

            <button
                onClick={() => {
                    logEvent("page_view", "Navigation", "Add Co-Admin");
                    router.push("/pages/system_admin/co_admin/create");
                }}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded"
            >
                Add Co-Admin
            </button>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs">#</th>
                        <th className="px-6 py-3 text-left text-xs">Username</th>
                        <th className="px-6 py-3 text-left text-xs">Email</th>
                        <th className="px-6 py-3 text-left text-xs">Status</th>
                        <th className="px-6 py-3 text-left text-xs">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {admins.map((a, i) => (
                        <tr key={a.admin_id} className="border-b">
                            <td className="px-6 py-4">{i + 1}</td>
                            <td className="px-6 py-4">{a.username}</td>
                            <td className="px-6 py-4">{a.email}</td>
                            <td className="px-6 py-4">
                  <span
                      className={`px-2 py-1 text-xs rounded ${
                          a.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                      }`}
                  >
                    {a.status}
                  </span>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button
                                    onClick={() => handleEdit(a.admin_id)}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center"
                                >
                                    <FaEdit className="mr-1" /> Edit
                                </button>

                                <button
                                    onClick={() =>
                                        handleStatusChange(
                                            a.admin_id,
                                            a.status === "active" ? "disabled" : "active"
                                        )
                                    }
                                    className="bg-gray-600 text-white px-3 py-1 rounded flex items-center"
                                >
                                    <MdPersonAddDisabled className="mr-1" />
                                    {a.status === "active" ? "Disable" : "Enable"}
                                </button>

                                <button
                                    onClick={() =>
                                        router.push(
                                            `/pages/system_admin/co_admin/details/${a.admin_id}`
                                        )
                                    }
                                    className="bg-blue-600 text-white px-3 py-1 rounded flex items-center"
                                >
                                    <FaEye className="mr-1" /> View
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {editModal && (
                <EditModal
                    formData={formData}
                    handleChange={(e) =>
                        setFormData({ ...formData, [e.target.name]: e.target.value })
                    }
                    handlePermissionChange={handlePermissionChange}
                    handleUpdate={handleUpdate}
                    closeModal={() => setEditModal(false)}
                />
            )}
        </div>
    );
}
