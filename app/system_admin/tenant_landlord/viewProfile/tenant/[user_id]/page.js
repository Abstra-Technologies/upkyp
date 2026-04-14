'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingScreen from "../../../../components/loadingScreen";
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function TenantDetails() {
    const params = useParams();
    const router = useRouter();
    const user_id = params?.user_id;
    
    const [tenantInfo, setTenantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchTenantDetails = async () => {
            try {
                const response = await fetch(`/api/tenant/details/${user_id}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch tenant details.');
                }
                const data = await response.json();
                setTenantInfo(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchTenantDetails();
    }, [user_id]);
    
    const handleGoBack = () => {
        router.back();
    };
    
    if (loading) return <LoadingScreen />;
    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
            <button 
                onClick={handleGoBack}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Go Back
            </button>
        </div>
    );
    
    return (
        <div className="flex">
            <SideNavAdmin />

        <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
            <button 
                onClick={handleGoBack}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Back
            </button>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4">
                    <h2 className="text-2xl font-semibold">Tenant Details</h2>
                </div>
                
                {/* Profile Section */}
                <div className="flex flex-col items-center p-6 border-b border-gray-200 bg-gray-50">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-md mb-4">
                        <img
                            src={tenantInfo?.profilePicture || "/default-avatar.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {tenantInfo?.firstName} {tenantInfo?.lastName}
                    </h3>
                    <p className="text-gray-600 flex items-center mt-1">
                        <FaEnvelope className="mr-2 text-blue-500" /> {tenantInfo?.email}
                    </p>
                </div>
                
                {/* Tenant Information */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaIdCard className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">User ID</p>
                                <p className="font-medium">{tenantInfo?.user_id}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaIdCard className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tenant ID</p>
                                <p className="font-medium">{tenantInfo?.tenant_id}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaPhone className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{tenantInfo?.phoneNumber || "N/A"}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaEnvelope className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email Address</p>
                                <p className="font-medium">{tenantInfo?.email || "N/A"}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                {tenantInfo?.emailVerified ? 
                                    <FaCheckCircle className="text-green-600" /> : 
                                    <FaTimesCircle className="text-red-600" />
                                }
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email Verification</p>
                                <p className={`font-medium ${tenantInfo?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                                    {tenantInfo?.emailVerified ? "Verified" : "Not Verified"}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaCalendarAlt className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Joined On</p>
                                <p className="font-medium">
                                    {new Date(tenantInfo?.tenantCreatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className='bg-blue-100 p-2 rounded-lg mr-3'>
                                <p className="text-sm text-gray-500">Account Status</p>
                                {tenantInfo?.is_active ? "Active" : "De-activated"}
                            </div>
                        </div>
                    </div>
                    
                    {/* Activity Logs */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Activity Logs</h3>
                        
                        {tenantInfo?.activityLogs?.length > 0 ? (
                            <div className="bg-gray-50 rounded-lg border border-gray-200">
                                {tenantInfo.activityLogs.map((log, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-3 flex items-start ${index !== tenantInfo.activityLogs.length - 1 ? "border-b border-gray-200" : ""}`}
                                    >
                                        <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{log.action}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                                No activity logs available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}