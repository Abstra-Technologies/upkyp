"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { BUG_REPORT_STATUSES } from "@/constant/bugStatus";
import useAuthStore from "@/zustand/authStore";
import SideNavAdmin from "@/components/navigation/sidebar-admin";
import LoadingScreen from "@/components/loadingScreen";


const maskUserID = (userID) => {
  if (!userID || typeof userID !== 'string' || userID.length < 8) return "Anonymous";
  return userID.substring(0, 4) + "****-****-****-****-" + userID.slice(-4);
};

export default function BugReportDetails() {
  const router = useRouter();
  const { report_id } = useParams();
  const [bugReport, setBugReport] = useState(null);
  const [status, setStatus] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchSession, user, admin } = useAuthStore();

  useEffect(() => {
    async function fetchBugReport() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/systemadmin/bugReport/getDetailedReports/${report_id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch bug report: ${res.status}`);
        }
        const data = await res.json();
        setBugReport(data);
        setStatus(data.status || "open");
        setAdminMessage(data.admin_message || "");
      } catch (err) {
        console.error("Error fetching bug report:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (report_id) {
      fetchBugReport();
    }
  }, [report_id]);

  const handleUpdate = async () => {
    if (!admin?.admin_id) {
      alert("Admin authentication required. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/systemadmin/bugReport/updateStatus/${report_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          adminMessage, 
          updatedByAdmin: admin.admin_id 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Update local state to reflect changes
      setBugReport(prev => ({
        ...prev,
        status,
        admin_message: adminMessage,
        updated_at: new Date().toISOString()
      }));
      
      // Show success message
      alert("Bug report updated successfully");
    } catch (err) {
      console.error("Failed to update bug report:", err);
      alert(`Failed to update bug report: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge based on status
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    switch(status.toLowerCase()) {
      case 'open':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaExclamationTriangle className="mr-1 text-blue-600" /> {status}
          </span>
        );
      case 'in progress':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaClock className="mr-1 text-blue-600" /> {status}
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1 text-blue-600" /> {status}
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideNavAdmin />
        <div className="flex-1 p-8">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideNavAdmin />
        <div className="flex-1 p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <div className="mt-4 flex space-x-4">
                  <button 
                    onClick={() => router.push('/system_admin/bug_report/list')} 
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Back to Bug Reports
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SideNavAdmin />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/system_admin/bug_report/list')}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Bug Reports
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <FaBug className="text-blue-600 mr-4 text-3xl" />
              <h1 className="text-2xl font-bold text-blue-600">Bug Report Details</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaUser className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-500">Reported by:</span>
                </div>
                <p className="font-medium">{maskUserID(bugReport?.user_id)}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-500">Reported on:</span>
                </div>
                <p className="font-medium">
                  {bugReport?.created_at ? new Date(bugReport.created_at).toLocaleString() : "N/A"}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-500">Current Status:</span>
                </div>
                <div>{getStatusBadge(bugReport?.status)}</div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{bugReport?.subject || "No Subject"}</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">
                  {bugReport?.description || "No description provided"}
                </p>
              </div>
            </div>
            
            {bugReport?.admin_message && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-2 text-gray-700">Previous Admin Response</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-700 whitespace-pre-line">{bugReport.admin_message}</p>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Update this Bug Report</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Status:</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {BUG_REPORT_STATUSES.map(({value, label}) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Admin Response:</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-32"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Enter your response to this bug report..."
                  rows={5}
                />
              </div>
              
              <div className="flex justify-end">
                <button 
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}