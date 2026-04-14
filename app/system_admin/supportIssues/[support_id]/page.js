"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Closed"];

export default function SupportDetails() {
    const router = useRouter();
    const { support_id } = useParams();
    const [supportRequest, setSupportRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!support_id) return;
        fetchSupportRequest();
    }, [support_id]);

    const fetchSupportRequest = async () => {
        setLoading(true);
        try {
            console.log(`Fetching support request with ID: ${support_id}`);

            const response = await fetch(`/api/support/${support_id}`);
            if (!response.ok)  new Error(`Failed to fetch request: ${response.statusText}`);

            const data = await response.json();
            console.log("API Response Data:", data);

            if (!data || Object.keys(data).length === 0) {
                 new Error("Support request not found.");
            }
            setSupportRequest(data);
        } catch (error) {
            console.error("Fetch Error:", error);
            await Swal.fire("Error", error.message || "Failed to fetch support request details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async () => {
        const { value: newStatus } = await Swal.fire({
            title: "Update Status",
            input: "select",
            inputOptions: STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: status }), {}),
            inputValue: supportRequest?.status,
            showCancelButton: true,
            confirmButtonText: "Next",
            cancelButtonText: "Cancel",
        });

        if (!newStatus || newStatus === supportRequest?.status) return;

        const { value: newMessage } = await Swal.fire({
            title: "Enter Message",
            input: "textarea",
            inputPlaceholder: "Enter your message to the user...",
            inputValue: message,
            showCancelButton: true,
            confirmButtonText: "Send",
            cancelButtonText: "Cancel",
        });

        if (!newMessage) return;

        try {
            const response = await fetch(`/api/support/updateStatus`, { // ✅ Fixed endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ support_id, status: newStatus, message: newMessage }), // ✅ Send message
            });

            if (!response.ok) throw new Error("Failed to send email notification.");

            Swal.fire("Success!", "Support status update has been emailed to the user.", "success");
            setMessage(""); // ✅ Clear message input
            fetchSupportRequest(); // Refresh data after update
        } catch (error) {
            console.error("Update Error:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <Suspense fallback={<p>Loading support request...</p>}>
            <div className="flex">
                <SideNavAdmin />

            <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Support Request Details</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : supportRequest ? (
                    <div>
                        <p><strong>Support ID:</strong> {supportRequest?.support_id}</p> {/* ✅ Display Support ID */}
                        <p><strong>Email:</strong> {supportRequest?.email}</p>
                        <p><strong>Issue:</strong> {supportRequest?.issue}</p>
                        <p><strong>Status:</strong> {supportRequest?.status}</p>
                        <p><strong>Created At:</strong> {new Date(supportRequest?.created_at).toLocaleString()}</p>

                        {/* Message Input Field */}
                        <label className="block text-gray-700 font-medium mt-4">Admin Message:</label>
                        <textarea
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            rows="3"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter message to user..."
                        />

                        <button
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            onClick={updateStatus}
                        >
                            Update Status & Send Email
                        </button>

                        <button
                            className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                            onClick={() => router.push("/system_admin/supportIssues")}
                        >
                            Back to List
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-600">Support request not found.</p>
                )}
            </div>
            </div>
        </Suspense>
    );
}

