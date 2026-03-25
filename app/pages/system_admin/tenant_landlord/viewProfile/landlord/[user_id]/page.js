'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LandlordSubscriptionCurrent from "../../../../../../../components/landlord/Landlordubscription";
import PropertyListUser from "../../../../../../../components/landlord/PropertyLists";
import LoadingScreen from "../../../../../../../components/loadingScreen";
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import SideNavAdmin from "../../../../../../../components/navigation/sidebar-admin";

export default function LandlordDetails() {
    const params = useParams();
    const router = useRouter();
    const user_id = params?.user_id;
    
    const [landlordInfo, setLandlordInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchLandlordDetails = async () => {
            try {
                const response = await fetch(`/api/systemadmin/users/getAllLandlords/getLandlordDetailed/${user_id}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch landlord details.');
                }
                const data = await response.json();
                setLandlordInfo(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchLandlordDetails();
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
        <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
            <button 
                onClick={handleGoBack}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Back
            </button>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                    <h2 className="text-2xl font-semibold">Landlord Details</h2>
                </div>
                
                <div className="flex flex-col items-center p-6 border-b border-gray-200 bg-gray-50">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-md mb-4">
                        <img
                            src={landlordInfo?.profilePicture || "/default-avatar.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {landlordInfo?.firstName} {landlordInfo?.lastName}
                    </h3>
                    <p className="text-gray-600 flex items-center mt-1">
                        <FaEnvelope className="mr-2 text-blue-500" /> {landlordInfo?.email}
                    </p>
                </div>
                
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaIdCard className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">User ID</p>
                                <p className="font-medium">{landlordInfo?.user_id}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaIdCard className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Landlord ID</p>
                                <p className="font-medium">{landlordInfo?.landlord_id}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaPhone className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{landlordInfo?.phoneNumber || "N/A"}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <FaEnvelope className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email Address</p>
                                <p className="font-medium">{landlordInfo?.email || "N/A"}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                {landlordInfo?.emailVerified ? 
                                    <FaCheckCircle className="text-green-600" /> : 
                                    <FaTimesCircle className="text-red-600" />
                                }
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email Verification</p>
                                <p className={`font-medium ${landlordInfo?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                                    {landlordInfo?.emailVerified ? "Verified" : "Not Verified"}
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
                                    {new Date(landlordInfo?.landlordCreatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg mr-3 ${landlordInfo?.is_active === 1 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <span className="font-semibold">
        {landlordInfo?.is_active === 1 ? "Active" : "De-activated"}
    </span>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Subscription Information</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <LandlordSubscriptionCurrent user_id={user_id} />
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Properties</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <PropertyListUser user_id={user_id} />
                        </div>
                    </div>
                    
                    {/* Activity Logs */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Activity Logs</h3>
                        
                        {landlordInfo?.activityLogs?.length > 0 ? (
                            <div className="bg-gray-50 rounded-lg border border-gray-200">
                                {landlordInfo.activityLogs.map((log, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-3 flex items-start ${index !== landlordInfo.activityLogs.length - 1 ? "border-b border-gray-200" : ""}`}
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