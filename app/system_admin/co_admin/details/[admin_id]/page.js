"use client"; // Needed for Client Components

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SideNavAdmin from "@/components/navigation/sidebar-admin";

function AdminDetailsPage() {
    const { admin_id } = useParams();
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [activityLog, setActivityLog] = useState([]);

    useEffect(() => {
        async function fetchAdminDetails() {
            try {
                const response = await fetch(`/api/systemadmin/co_admin/getAdminDetail/${admin_id}`);
                const data = await response.json();
                if (data.success) {
                    setAdmin(data.admin);
                    setActivityLog(data.activityLog);
                } else {
                    alert("Admin not found.");
                    router.push("/system_admin/co_admin");
                }
            } catch (error) {
                console.error("Error fetching admin details:", error);
            }
        }

        fetchAdminDetails();
    }, [admin_id]);

    if (!admin) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Details</h2>
            <p className='text-3xl p-2'><strong>Name:</strong> {admin.username}</p>
            <p className='text-3xl p-2'><strong>Email:</strong> {admin.email}</p>
            <p className='text-3xl p-2'><strong>Role:</strong> {admin.role}</p>
            <h3 className='text-3xl mt-10'>Activity Logs</h3>
            <div className="mt-4 bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-200 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left border-b">Action</th>
                        <th className="px-4 py-2 text-left border-b">Timestamp</th>
                    </tr>
                    </thead>
                    <tbody>
                    {activityLog.length > 0 ? (
                        activityLog.map((log, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">{log.action}</td>
                                <td className="px-4 py-2 text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2" className="px-4 py-2 text-gray-500 text-center">
                                No activity found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>


            <button
                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                onClick={() => router.push("/system_admin/co_admin/list")}
            >
                Back
            </button>
        </div>
    );
}

function AdminDetailsSuspenseWrapper() {
    return (
        <Suspense fallback={<p className="text-center text-gray-600">Loading admin details...</p>}>
            <div className="flex">
            <SideNavAdmin />
            <AdminDetailsPage />
            </div>
        </Suspense>
    );
}

export default AdminDetailsSuspenseWrapper;
