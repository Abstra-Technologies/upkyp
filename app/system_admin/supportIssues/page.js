'use client'
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter} from "next/navigation";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Closed"];

export default function AdminSupportList() {
    const [supportRequests, setSupportRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchSupportRequests();
    }, []);

    const fetchSupportRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/systemadmin/customerSupport/getAllRequest");
            const data = await response.json();
            setSupportRequests(data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            await Swal.fire("Error", "Failed to fetch support requests.", "error");
        } finally {
            setLoading(false);
        }
    };
    const viewDetails = (support_id) => {
        router.push(`./supportIssues/${support_id}`);
    };

    return (
        <div className="flex">
            <SideNavAdmin />

            <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Support Requests</h2>

            {loading ? <p>Loading support requests...</p> : null}

            {supportRequests.length === 0 && !loading ? (
                <p className="text-gray-600">No support requests found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-md">
                        <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="px-4 py-2 border">Email</th>
                            <th className="px-4 py-2 border">Issue</th>
                            <th className="px-4 py-2 border">Message</th>
                            <th className="px-4 py-2 border">Status</th>
                            <th className="px-4 py-2 border">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {supportRequests.map((request) => (
                            <tr key={request?.support_id} className="border text-gray-800">
                                <td className="px-4 py-2 border">{request?.email}</td>
                                <td className="px-4 py-2 border">{request?.issue}</td>
                                <td className="px-4 py-2 border">{request?.message}</td>
                                <td className="px-4 py-2 border">{request?.status}</td>
                                <td className="px-4 py-2 border text-center">
                                    <button
                                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                                        onClick={() => viewDetails(request?.support_id)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </div>
    );
}
