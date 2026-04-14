'use client'
import {useParams, useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Calendar } from "lucide-react";

export default function UserActivityLogPage() {
    const router = useRouter();
    const { id } = useParams();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actorName, setActorName] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/activityLogs/user/${id}`);
                const data = await res.json();

                if (Array.isArray(data.logs)) {
                    setLogs(data.logs);
                    if (data.logs.length > 0) {
                        const sample = data.logs[0];
                        setIsAdmin(!!sample.admin_id);
                        setActorName(
                            sample.admin_id ? sample.adminUsername : `${sample.firstName} ${sample.lastName}`
                        );
                    }
                }
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [id]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Activity Logs for {actorName || "..."} {isAdmin ? "(Admin)" : "(User)"}
                    </h1>
                    <Link href="/pages/system_admin/activiyLog" className="text-indigo-600 text-sm hover:underline">
                        ← Back to Logs
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2" />
                        No activity logs found for this user.
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log.log_id}>
                                    <td className="px-6 py-4 text-sm text-gray-700">{log.action}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
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
