"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Swal from "sweetalert2";
import axios from "axios";
import {
    Building2,
    Plus,
    Search,
    RefreshCw,
    Home,
    MapPin,
    TrendingUp,
    Users,
    Lock,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import { GRADIENT_PRIMARY, GRADIENT_TEXT } from "@/constant/design-constants";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Property {
    property_id: string;
    property_name: string;
    city: string;
    province: string;
    street: string;
    property_type: string;
    status: string;
    verification_status: string | null;
    total_units: number;
    occupied_units: number;
    total_income: number;
    photos: { photo_id: number; photo_url: string | null }[];
}

export default function PropertiesPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();
    const landlordId = user?.landlord_id as string | undefined;
    const { subscription, loadingSubscription } = useSubscription(landlordId);

    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data, error, isLoading, mutate } = useSWR(
        landlordId ? "/api/landlord/properties/getAllProperties" : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 30000,
        }
    );

    console.log('data api: ', data);

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    const properties: Property[] = data?.data ?? [];

    const filteredProperties = properties.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
            p.property_name.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.province.toLowerCase().includes(q) ||
            p.property_type.toLowerCase().includes(q)
        );
    });

    const maxProperties = subscription?.limits?.maxProperties ?? null;
    const reachedPropertyLimit =
        maxProperties !== null && properties.length >= maxProperties;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await mutate();
        setIsRefreshing(false);
    };

    const handleView = (propertyId: string) => {
        router.push(`/landlord/properties/${propertyId}`);
    };

    const handleEdit = (propertyId: string) => {
        router.push(`/landlord/properties/${propertyId}/editPropertyDetails`);
    };

    const handleDelete = async (propertyId: string, propertyName: string) => {
        const confirm = await Swal.fire({
            title: "Delete Property?",
            html: `Are you sure you want to delete <strong>${propertyName}</strong>?<br/><span class="text-red-500 text-sm">This action cannot be undone.</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(
                `/api/propertyListing/deletePropertyListing/${propertyId}`,
                { method: "DELETE" }
            );

            const result = await res.json();

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Property Deleted",
                    text: result.message,
                    confirmButtonColor: "#10B981",
                });
                mutate();
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Unable to Delete",
                    text: result.error || "Something went wrong.",
                    confirmButtonColor: "#d33",
                });
            }
        } catch {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to delete property. Please try again.",
                confirmButtonColor: "#d33",
            });
        }
    };

    const getOccupancyColor = (rate: number) => {
        if (rate >= 80) return "from-emerald-500 to-emerald-400";
        if (rate >= 50) return "from-amber-500 to-amber-400";
        if (rate > 0) return "from-red-500 to-red-400";
        return "from-gray-400 to-gray-300";
    };

    const gradients = [
        "from-blue-100 to-emerald-100",
        "from-violet-100 to-pink-100",
        "from-amber-100 to-orange-100",
        "from-cyan-100 to-sky-100",
        "from-rose-100 to-red-100",
        "from-indigo-100 to-purple-100",
    ];

    if (isLoading) {
        return (
            <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                        <div>
                            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-gray-200 p-4"
                        >
                            <div className="h-32 bg-gray-200 rounded-xl animate-pulse mb-3" />
                            <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4" />
                            <div className="h-2 bg-gray-200 rounded-full animate-pulse mb-2" />
                            <div className="flex gap-2">
                                <div className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${GRADIENT_PRIMARY} rounded-xl flex items-center justify-center shadow-md`}>
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Properties Portfolio
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600">
                            {properties.length} {properties.length === 1 ? "property" : "properties"} total
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        onClick={() => router.push("/landlord/properties/create-property")}
                        disabled={reachedPropertyLimit && !loadingSubscription}
                        className={`flex items-center gap-2 px-4 py-2 ${GRADIENT_PRIMARY} text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Property</span>
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            {properties.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-500 font-medium">Total</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{properties.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Home className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs text-gray-500 font-medium">Units</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                            {properties.reduce((sum, p) => sum + p.total_units, 0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-violet-600" />
                            <span className="text-xs text-gray-500 font-medium">Occupied</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                            {properties.reduce((sum, p) => sum + p.occupied_units, 0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-gray-500 font-medium">Income</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                            ₱{properties.reduce((sum, p) => sum + p.total_income, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Search */}
            {properties.length > 0 && (
                <div className="relative w-full sm:max-w-md mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    />
                </div>
            )}

            {/* Property Limit Warning */}
            {reachedPropertyLimit && !loadingSubscription && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Property Limit Reached</p>
                        <p className="text-xs text-amber-700">
                            Your plan allows {maxProperties} {maxProperties === 1 ? "property" : "properties"}. Upgrade to add more.
                        </p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredProperties.length === 0 && !isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {searchQuery ? "No properties found" : "No properties yet"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {searchQuery
                                ? "Try adjusting your search terms"
                                : "Get started by adding your first property"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => router.push("/landlord/properties/create-property")}
                                disabled={reachedPropertyLimit && !loadingSubscription}
                                className={`inline-flex items-center gap-2 px-6 py-3 ${GRADIENT_PRIMARY} text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50`}
                            >
                                <Plus className="w-4 h-4" />
                                Add Your First Property
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Property Grid */}
            {filteredProperties.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {filteredProperties.map((property, index) => {
                        const totalUnits = property.total_units || 0;
                        const occupiedUnits = property.occupied_units || 0;
                        const occupancyRate =
                            totalUnits > 0
                                ? Math.round((occupiedUnits / totalUnits) * 100)
                                : 0;
                        const gradientBg =
                            gradients[index % gradients.length];
                        const isLockedByPlan =
                            maxProperties !== null &&
                            index + 1 > maxProperties;

                        return (
                            <div
                                key={property.property_id}
                                className={`group relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${gradientBg} ${isLockedByPlan ? "opacity-60 pointer-events-none" : ""}`}
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-t ${getOccupancyColor(occupancyRate)} opacity-[0.08] pointer-events-none`}
                                    style={{ clipPath: `inset(${100 - occupancyRate}% 0 0 0)` }}
                                />

                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 pointer-events-none">
                                    <div
                                        className={`w-full bg-gradient-to-b ${getOccupancyColor(occupancyRate)} transition-all duration-700`}
                                        style={{ height: `${occupancyRate}%`, position: "absolute", bottom: 0 }}
                                    />
                                </div>

                                <div className="relative flex flex-col p-4 h-full">
                                    {/* Photo */}
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-white/60">
                                        {property.photos.length > 0 && property.photos[0]?.photo_url ? (
                                            <img
                                                src={property.photos[0].photo_url}
                                                alt={property.property_name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <img
                                                src="https://res.cloudinary.com/dptmeluy0/image/upload/v1777092988/clean-square-placeholder-icon-for-a-real-estate-ap_ffjmwv.jpg"
                                                alt="Property placeholder"
                                                className="object-cover w-full h-full"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">
                                            {property.property_name || "Unnamed Property"}
                                        </h3>
                                        <div className="flex items-center text-gray-500 text-xs mb-3">
                                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                            <span className="line-clamp-1">
                                                {[property.city, property.province]
                                                    .filter(Boolean)
                                                    .join(", ") || "No address"}
                                            </span>
                                        </div>

                                        {/* Occupancy */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-600">Occupancy</span>
                                                <span className={`text-xs font-bold bg-gradient-to-r ${getOccupancyColor(occupancyRate)} bg-clip-text text-transparent`}>
                                                    {occupancyRate}%
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-white/70 rounded-full overflow-hidden border border-gray-200/50">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${getOccupancyColor(occupancyRate)} rounded-full transition-all duration-700`}
                                                    style={{ width: `${occupancyRate}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {occupiedUnits} of {totalUnits} units occupied
                                            </p>
                                        </div>

                                        {/* Income */}
                                        <div className="flex items-center gap-1.5 p-2 bg-white/60 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-[10px] text-gray-500 leading-tight">Monthly Income</p>
                                                <p className="text-sm font-bold text-gray-800">
                                                    ₱{property.total_income.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleView(property.property_id)}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm hover:shadow-md transition-all"
                                        >
                                            <Home className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEdit(property.property_id)}
                                            className="p-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(property.property_id, property.property_name)}
                                            className="p-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
