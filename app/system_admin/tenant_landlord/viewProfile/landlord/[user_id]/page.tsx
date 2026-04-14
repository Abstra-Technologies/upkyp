'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LandlordSubscriptionCurrent from "../../../../components/landlord/Landlordubscription";
import PropertyListUser from "../../../../components/landlord/PropertyLists";
import LoadingScreen from "../../../../components/loadingScreen";
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaWallet, FaPlus, FaCopy, FaBuilding, FaList, FaHistory } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";

export default function LandlordDetails() {
    const params = useParams();
    const router = useRouter();
    const user_id = params?.user_id;
    
    const [landlordInfo, setLandlordInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"subscription" | "properties" | "activity">("subscription");

    const tabs = [
        { id: "subscription", label: "Subscription", icon: FaList },
        { id: "properties", label: "Properties", icon: FaBuilding },
        { id: "activity", label: "Activity Logs", icon: FaHistory },
        { id: "ledger", label: "Wallet Ledger Log", icon: FaHistory },

    ] as const;
    
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

    const handleCreateWallet = async () => {
        const { isConfirmed } = await Swal.fire({
            title: "Create Wallet",
            text: "This will generate a new wallet ID for the landlord.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, create wallet",
            cancelButtonText: "Cancel",
        });

        if (!isConfirmed) return;

        try {
            setIsCreatingWallet(true);
            const res = await axios.put(
                `/api/systemadmin/users/getAllLandlords/getLandlordDetailed/${user_id}`,
                { action: "create_wallet" }
            );

            setLandlordInfo((prev: any) => ({
                ...prev,
                wallet: res.data.wallet,
            }));

            await Swal.fire("Success!", "Wallet created successfully.", "success");
        } catch (err: any) {
            await Swal.fire("Error!", err.response?.data?.error || "Failed to create wallet.", "error");
        } finally {
            setIsCreatingWallet(false);
        }
    };

    const copyWalletId = (walletId: string) => {
        navigator.clipboard.writeText(walletId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        <div className="max-w-5xl mx-auto p-3 sm:p-4 min-h-screen">
            <button 
                onClick={handleGoBack}
                className="mb-3 px-3 py-1.5 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors flex items-center"
            >
                <FaArrowLeft className="mr-2 w-4 h-4" /> Back
            </button>
            
            <div className="overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 shrink-0">
                        <img
                            src={landlordInfo?.profilePicture || "https://res.cloudinary.com/dptmeluy0/image/upload/v1764120619/Portrait_Placeholder_hexdd5.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">
                            {landlordInfo?.firstName} {landlordInfo?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{landlordInfo?.email}</p>
                    </div>
                </div>
                    </div>
                </div>
                
                <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2">Personal Info</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-500">User ID</p>
                            <p className="font-medium text-xs truncate" title={landlordInfo?.user_id}>{landlordInfo?.user_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Landlord ID</p>
                            <p className="font-medium text-xs">{landlordInfo?.landlord_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium text-xs">{landlordInfo?.phoneNumber || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Email Verified</p>
                            <span className={`text-xs font-medium ${landlordInfo?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                                {landlordInfo?.emailVerified ? "Verified" : "Not Verified"}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Joined</p>
                            <p className="font-medium text-xs">
                                {new Date(landlordInfo?.landlordCreatedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span className={`text-xs font-medium ${landlordInfo?.is_active === 1 ? "text-green-600" : "text-red-600"}`}>
                                {landlordInfo?.is_active === 1 ? "Active" : "De-activated"}
                            </span>
                        </div>
                    </div>

                    {/* Wallet Section */}
                    <div className="mt-3">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1 flex items-center">
                            <FaWallet className="mr-2 w-4 h-4" /> Wallet
                        </h3>
                        
                        {landlordInfo?.wallet ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Wallet ID</p>
                                    <p className="font-mono text-xs text-gray-700 break-all">
                                        {landlordInfo.wallet.wallet_id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Balance</p>
                                    <p className="text-sm font-bold text-emerald-600">
                                        ₱{Number(landlordInfo.wallet.available_balance || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaTimesCircle className="text-amber-600 w-4 h-4" />
                                    <span className="text-sm text-gray-700">No Wallet</span>
                                </div>
                                <button
                                    onClick={handleCreateWallet}
                                    disabled={isCreatingWallet}
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                                >
                                    {isCreatingWallet ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <FaPlus className="w-3 h-3" />
                                    )}
                                    Create
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mt-4">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-3 overflow-x-auto" aria-label="Tabs">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex items-center gap-1 py-2 px-1 border-b-2 font-medium text-xs whitespace-nowrap transition-colors
                                                ${isActive
                                                    ? "border-blue-600 text-blue-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                                }
                                            `}
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="mt-4">
                            {activeTab === "subscription" && (
                                <div className="py-2">
                                    <LandlordSubscriptionCurrent user_id={user_id} />
                                </div>
                            )}

                            {activeTab === "properties" && (
                                <div className="py-2">
                                    <PropertyListUser user_id={user_id} />
                                </div>
                            )}

                            {activeTab === "activity" && (
                                <div>
                                    {landlordInfo?.activityLogs?.length > 0 ? (
                                        <div>
                                            {landlordInfo.activityLogs.map((log, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`py-2 flex items-start ${index !== landlordInfo.activityLogs.length - 1 ? "border-b border-gray-200" : ""}`}
                                                >
                                                    <div className="text-gray-400 text-xs mr-2">
                                                        {index + 1}.
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">{log.action}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            No activity logs available.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );
}