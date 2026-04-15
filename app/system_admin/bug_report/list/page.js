"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import useSWR from "swr";
import SideNavAdmin from "@/components/navigation/sidebar-admin";
import LoadingScreen from "@/components/loadingScreen";
import {useState} from "react";

// Fetch function for SWR
const fetcher = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch bug reports");
    return res.json();
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    throw error;
  }
};

export default function BugReports() {
  const { fetchSession, user, admin } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, error, isLoading, mutate } = useSWR("/api/systemadmin/bugReport/getAllReports", fetcher, { 
    refreshInterval: 10000,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Only retry up to 3 times
      if (retryCount >= 3) return;
      // Retry after 5 seconds
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 5000);
    }
  });

  // Get status badge based on status
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    switch(status.toLowerCase()) {
      case 'open':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaExclamationTriangle className="mr-1" /> {status}
          </span>
        );
      case 'in progress':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaClock className="mr-1" /> {status}
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (error) return (
    <div className="flex h-screen bg-gray-50">
      <SideNavAdmin />
      <div className="flex-1 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3" />
            <div>
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">Failed to load bug reports.</span>
              <button 
                onClick={() => mutate()} 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (isLoading) return (
    <div className="flex h-screen bg-gray-50">
      <SideNavAdmin />
      <div className="flex-1 p-8">
        <LoadingScreen />
      </div>
    </div>
  );

  // Handle potentially undefined data
  const bugReports = data?.bugReports || [];

  // Filter bug reports based on search term and status filter
  const filteredReports = bugReports.filter(report => {
    const matchesSearch = 
      (report.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (report.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter ? 
      (report.status?.toLowerCase() || "") === statusFilter.toLowerCase() : true;
    
    return matchesSearch && matchesFilter;
  });

  // Get unique statuses for filter dropdown
  const statuses = [...new Set(bugReports.map(report => report.status).filter(Boolean))];

  return (
    <div className="flex h-screen bg-gray-50">
      <SideNavAdmin />
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-8">
            <FaBug className="text-blue-600 mr-4 text-3xl" />
            <h1 className="text-2xl font-bold text-blue-600">Bug Reports Dashboard</h1>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="relative md:col-span-3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-blue-600" />
              </div>
              <input
                type="text"
                placeholder="Search by subject or description..."
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative md:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaFilter className="text-blue-600" />
              </div>
              <select
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-500 text-lg">No bug reports found matching your criteria</p>
              {searchTerm || statusFilter ? (
                <button 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                  }}
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report, index) => (
                    <tr key={report.report_id ?? `temp-key-${index}`} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                        onClick={() => router.push(`./${report.report_id}`)}
                      >
                        {report.subject || "Untitled Report"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{report.description || "No description provided"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.user_id || "Anonymous"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.created_at ? new Date(report.created_at).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6 text-right">
            <p className="text-sm text-gray-500">Showing {filteredReports.length} of {bugReports.length} bug reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import useSWR from "swr";
//
// const fetcher = async (url: string) => {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("Failed to fetch bug reports");
//     return res.json();
// };
//
// export default function BugReports() {
//     const router = useRouter();
//     const { data, error, isLoading } = useSWR("/api/systemadmin/bugReport/list", fetcher, { refreshInterval: 5000 });
//
//     const [searchQuery, setSearchQuery] = useState("");
//
//     if (error) return <p className="text-red-500 text-center">Failed to load bug reports.</p>;
//     if (isLoading) return <p className="text-center text-gray-500">Loading bug reports...</p>;
//
//     // Function to filter bug reports based on search query
//     const filteredBugReports = data.bugReports.filter((report: any) =>
//         report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         report.description.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//
//     return (
//         <div className="p-6">
//             <h2 className="text-xl font-semibold mb-4">Bug Reports</h2>
//
//             {/* Search Bar */}
//             <input
//                 type="text"
//                 placeholder="Search by subject or description..."
//                 className="border p-2 w-full rounded mb-4"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//             />
//
//             {filteredBugReports.length === 0 ? (
//                 <p className="text-center text-gray-500">No bug reports found</p>
//             ) : (
//                 <div className="overflow-x-auto border border-gray-300 rounded-lg">
//                     <table className="table-auto w-full">
//                         <thead>
//                         <tr className="border-b border-gray-300 bg-gray-100">
//                             <th className="px-4 py-2">#</th>
//                             <th className="px-4 py-2">Subject</th>
//                             <th className="px-4 py-2">Status</th>
//                             <th className="px-4 py-2">Reported By</th>
//                             <th className="px-4 py-2">Created At</th>
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {filteredBugReports.map((report: any, index: number) => (
//                                 <tr key={report.report_id ?? `temp-key-${index}`}className="border-b">
//                                     <td className="px-4 py-2">{index + 1}</td>
//                                     <td
//                                         className="px-4 py-2 text-blue-500 cursor-pointer hover:underline"
//                                         onClick={() => router.push(`/admin/bugReports/${report.reportID}`)}
//                                     >
//                                         {report.subject}
//                                     </td>
//                                     <td className="px-4 py-2">{report.status}</td>
//                                     <td className="px-4 py-2">{report.User_userID || "N/A"}</td>
//                                     <td className="px-4 py-2">{new Date(report.createdAt).toLocaleString()}</td>
//                                 </tr>
//                                 ))}
//                             </tbody>
//                             </table>
//                             </div>
//             )}
//         </div>
//     );
// }
