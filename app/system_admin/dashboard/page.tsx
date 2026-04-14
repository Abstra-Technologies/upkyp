"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import PropertyAnalytics from "../../../../components/analytics/PropertyAnalytics";
import LoadingScreen from "../../../../components/loadingScreen";

export default function AdminDashboard() {
    const { admin, loading, fetchSession, signOutAdmin } = useAuthStore();
    const [hasChecked, setHasChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    /* 🔑 Verify session on mount – prevent race condition */
    useEffect(() => {
        fetchSession().finally(() => {
            setHasChecked(true);
        });
    }, [fetchSession]);

    /* Show loading until we've fully checked the session */
    if (loading || !hasChecked) {
        return <LoadingScreen />;
    }

    /* If not authenticated after check → redirect to login */
    if (!admin) {
        router.replace("/pages/admin_login");
        return <LoadingScreen />;
    }

    /* ================= DELETE ACCOUNT ================= */
    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: "Are you absolutely sure?",
            html: `
                <p class="text-left text-gray-700 mb-4">This action <strong>cannot be undone</strong>. It will:</p>
                <ul class="text-left text-gray-600 space-y-1">
                    <li>• Permanently delete your admin account</li>
                    <li>• Remove all access to the admin portal</li>
                    <li>• Potentially delete associated logs or records</li>
                </ul>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete my account",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            reverseButtons: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        setIsDeleting(true);

        try {
            const response = await fetch("/api/systemadmin/delete_account", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admin_id: admin.admin_id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete account.");
            }

            await Swal.fire({
                title: "Account Deleted",
                text: "Your admin account has been permanently removed.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            // Force logout and redirect
            await signOutAdmin();
        } catch (error: any) {
            await Swal.fire({
                title: "Error",
                text: error.message || "Something went wrong.",
                icon: "error",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    /* ================= LOGOUT ================= */
    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Logout?",
            text: "You will be signed out of the admin portal.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Logout",
            cancelButtonText: "Stay",
        });

        if (result.isConfirmed) {
            await signOutAdmin();
        }
    };

    /* ================= UI ================= */
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Upkyp Admin Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome back, <span className="font-semibold">{admin.username}</span> ({admin.role})
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            Logout
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? "Deleting..." : "Delete Account"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Admin Info Card */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Profile</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <p><strong>Username:</strong> {admin.username}</p>
                            <p><strong>Admin ID:</strong> {admin.admin_id}</p>
                            <p><strong>Email:</strong> {admin.email || "Not set"}</p>
                            <p><strong>Status:</strong> <span className="text-green-600 font-medium">{admin.status}</span></p>
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Analytics</h2>
                        <PropertyAnalytics />
                    </div>

                    {/* Reports Section */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Business Reports</h2>
                        <div className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <iframe
                                width="100%"
                                height="600"
                                src="https://lookerstudio.google.com/embed/reporting/543161d6-3d3e-44ab-b571-ec3446e99257/page/QogyE"
                                className="w-full h-full"
                                style={{ border: "none" }}
                                allowFullScreen
                                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Upkyp Admin Portal • All rights reserved
            </footer>
        </div>
    );
}