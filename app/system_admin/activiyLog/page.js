'use client'
import { useEffect, useState } from "react";
import useAuth from "../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";
import LoadingScreen from "../../../../components/loadingScreen";
import { Calendar, Download, Filter, Search, User, Eye } from "lucide-react";

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 10;
    const { admin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/activityLogs/logs");
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to fetch logs.");
                setLogs(data.logs || []);
                setFilteredLogs(data.logs || []);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        let result = logs;
        const now = new Date();
        if (activeFilter === "today") {
            const today = new Date(now.setHours(0, 0, 0, 0));
            result = result.filter(log => new Date(log.timestamp) >= today);
        } else if (activeFilter === "week") {
            const lastWeek = new Date(now.setDate(now.getDate() - 7));
            result = result.filter(log => new Date(log.timestamp) >= lastWeek);
        } else if (activeFilter === "month") {
            const lastMonth = new Date(now.setDate(now.getDate() - 30));
            result = result.filter(log => new Date(log.timestamp) >= lastMonth);
        }

        if (actionFilter !== "all") {
            result = result.filter(log => {
                const action = log.action?.toLowerCase() || "";
                if (actionFilter === "create") return action.includes("create") || action.includes("add");
                if (actionFilter === "delete") return action.includes("delete") || action.includes("remove");
                if (actionFilter === "update") return action.includes("update") || action.includes("edit");
                if (actionFilter === "view") return action.includes("view") || action.includes("access");
                return true;
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log => 
                (log.user_id || log.admin_id || "").toString().toLowerCase().includes(term) ||
                (log.firstName || "").toLowerCase().includes(term) ||
                (log.action || "").toLowerCase().includes(term) ||
                (log.details || "").toLowerCase().includes(term)
            );
        }

        setFilteredLogs(result);
        setCurrentPage(1);
    }, [logs, activeFilter, searchTerm, actionFilter]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const currentItems = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const exportToCSV = () => {
        const headers = ["User ID", "User Name", "Action", "Timestamp"];
        const csvContent = [
            headers.join(","),
            ...filteredLogs.map(log => [
                log.user_id || log.admin_id || "N/A",
                `"${(log.firstName || "Anonymous User").replace(/"/g, '""')}"`,
                `"${(log.action || "Unknown Action").replace(/"/g, '""')}"`,
                `"${new Date(log.timestamp).toLocaleString()}"`,
                `"${(log.details || "").replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!admin) {
        return null;
    }

    if (loading) {
        return <LoadingScreen />;
    }

    const getActionBadgeClass = (action) => {
        const actionLower = action?.toLowerCase() || "";
        if (actionLower.includes("create") || actionLower.includes("add")) {
            return "bg-green-100 text-green-800";
        } else if (actionLower.includes("delete") || actionLower.includes("remove")) {
            return "bg-red-100 text-red-800";
        } else if (actionLower.includes("update") || actionLower.includes("edit")) {
            return "bg-yellow-100 text-yellow-800";
        } else if (actionLower.includes("view") || actionLower.includes("access")) {
            return "bg-blue-100 text-blue-800";
        }
        return "bg-gray-100 text-gray-800";
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            
            <SideNavAdmin />
    
           
            <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                        <p className="text-gray-600 mt-1">Monitor system and user activities across the platform</p>
                    </div>
                    
                   
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeFilter === "all" 
                                            ? "bg-indigo-100 text-indigo-700" 
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveFilter("all")}
                                >
                                    All Time
                                </button>
                                <button 
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeFilter === "today" 
                                            ? "bg-indigo-100 text-indigo-700" 
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveFilter("today")}
                                >
                                    Today
                                </button>
                                <button 
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeFilter === "week" 
                                            ? "bg-indigo-100 text-indigo-700" 
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveFilter("week")}
                                >
                                    Last 7 Days
                                </button>
                                <button 
                                    className={`hidden md:block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeFilter === "month" 
                                            ? "bg-indigo-100 text-indigo-700" 
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveFilter("month")}
                                >
                                    Last 30 Days
                                </button>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>

                                <button 
                                    className={`p-2 rounded-md border ${showFilters ? 'bg-indigo-50 border-indigo-200' : 'border-gray-300'}`}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="w-5 h-5 text-gray-600" />
                                </button>

                                <button 
                                    onClick={exportToCSV}
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
                                        <select 
                                            value={actionFilter}
                                            onChange={(e) => setActionFilter(e.target.value)}
                                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="all">All Actions</option>
                                            <option value="create">Create/Add</option>
                                            <option value="update">Update/Edit</option>
                                            <option value="delete">Delete/Remove</option>
                                            <option value="view">View/Access</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <button 
                                            onClick={() => {
                                                setActiveFilter("all");
                                                setActionFilter("all");
                                                setSearchTerm("");
                                            }}
                                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
    
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((log, index) => (
                                            <tr key={log.log_id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {log.adminUsername?.trim()
                                                                    ? log.adminUsername
                                                                    : `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim()}
                                                            </div>
                                                            <Link
                                                                href={`/pages/system_admin/users/${log.user_id || log.admin_id}`}
                                                                className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                                                            >
                                                                {log.user_id || log.admin_id || "N/A"}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(log.action)}`}>
                                                    {log.action || "Unknown Action"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <Calendar className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">No activity logs found</p>
                                                    <p className="mt-1 text-sm text-gray-500 max-w-md">
                                                        {searchTerm || activeFilter !== "all" || actionFilter !== "all" ? 
                                                            "Try adjusting your filters or search term to see more results." : 
                                                            "Activity logs will appear here as users interact with the system."}
                                                    </p>
                                                    {(searchTerm || activeFilter !== "all" || actionFilter !== "all") && (
                                                        <button
                                                            onClick={() => {
                                                                setActiveFilter("all");
                                                                setActionFilter("all");
                                                                setSearchTerm("");
                                                            }}
                                                            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-100"
                                                        >
                                                            Clear All Filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {filteredLogs.length > 0 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                            currentPage === 1 
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                                : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`ml-3 px-4 py-2 border rounded-md text-sm font-medium ${
                                            currentPage === totalPages 
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                                : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing 
                                            <span className="font-medium mx-1">
                                                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}
                                            </span>
                                            to 
                                            <span className="font-medium mx-1">
                                                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                                            </span>
                                            of 
                                            <span className="font-medium mx-1">{filteredLogs.length}</span>
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                                    currentPage === 1 
                                                        ? "text-gray-300 cursor-not-allowed" 
                                                        : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                let pageNumber;
                                                
                                                if (totalPages <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNumber = totalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNumber}
                                                        onClick={() => setCurrentPage(pageNumber)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            currentPage === pageNumber
                                                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                                    currentPage === totalPages 
                                                        ? "text-gray-300 cursor-not-allowed" 
                                                        : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}