'use client'
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../components/loadingScreen";

export default function LogsPage() {
    const [logs, setLogs] = useState("");
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setDataLoading(true);

                const response = await fetch("/api/auditlogs/logs");
                const text = await response.text();
                setLogs(text);
            } catch (error) {
                console.error("Error fetching audit logs:", error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    if ( dataLoading) {
        return <LoadingScreen />;
    }

    return (
        <div style={{ padding: "20px", background: "#000", color: "#fff", fontFamily: "monospace" }}>
            <h2>📜 Audit Logs</h2>
            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {logs || "Loading logs..."}
            </pre>
        </div>
    );
}
