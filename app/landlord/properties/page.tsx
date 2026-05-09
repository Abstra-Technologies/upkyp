"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    Building2,
    Plus,
    Search,
    RefreshCw,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import { GRADIENT_PRIMARY } from "@/constant/design-constants";
import PropertyCard from "@/components/landlord/properties/PropertyCard";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Property {
    property_id: string;
    property_name: string;
    property_subtype?: string;
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await mutate();
        setIsRefreshing(false);
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
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
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
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <button
                        onClick={() => router.push("/landlord/properties/create-property")}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 ${GRADIENT_PRIMARY} text-white rounded-lg font-semibold text-xs hover:shadow-lg transition-all`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Property
                    </button>
                </div>
            </header>

            {/* Search */}
            {properties.length > 0 && (
                <div className="relative w-full sm:max-w-md mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by property name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm
               border border-gray-400
               rounded-xl
               bg-gray-200 focus:bg-gray-200
               focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
               outline-none transition-all
               placeholder:text-gray-600
               shadow-sm"
                    />
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
                                className={`inline-flex items-center gap-2 px-6 py-3 ${GRADIENT_PRIMARY} text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all`}
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
                    {filteredProperties.map((property, index) => (
                        <PropertyCard
                            key={property.property_id}
                            property={property}
                            gradientBg={gradients[index % gradients.length]}
                            onMutate={mutate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
