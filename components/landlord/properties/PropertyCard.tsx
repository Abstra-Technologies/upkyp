"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
    Home,
    MapPin,
    TrendingUp,
} from "lucide-react";

interface PropertyCardProps {
    property: {
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
    };
    gradientBg: string;
    onMutate: () => void;
}

const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "from-emerald-500 to-emerald-400";
    if (rate >= 50) return "from-amber-500 to-amber-400";
    if (rate > 0) return "from-red-500 to-red-400";
    return "from-gray-400 to-gray-300";
};

export default function PropertyCard({ property, gradientBg, onMutate }: PropertyCardProps) {
    const router = useRouter();

    const totalUnits = property.total_units || 0;
    const occupiedUnits = property.occupied_units || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const handleView = () => {
        router.push(`/landlord/properties/${property.property_id}`);
    };

    const handleEdit = () => {
        router.push(`/landlord/properties/${property.property_id}/editPropertyDetails`);
    };

    const handleDelete = async () => {
        const confirm = await Swal.fire({
            title: "Delete Property?",
            html: `Are you sure you want to delete <strong>${property.property_name}</strong>?<br/><span class="text-red-500 text-sm">This action cannot be undone.</span>`,
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
                `/api/propertyListing/deletePropertyListing/${property.property_id}`,
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
                onMutate();
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

    return (
        <div
            className={`group relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${gradientBg}`}
        >
            <div
                className={`absolute inset-0 bg-gradient-to-t ${getOccupancyColor(occupancyRate)} opacity-[0.08] pointer-events-none sm:block hidden`}
                style={{ clipPath: `inset(${100 - occupancyRate}% 0 0 0)` }}
            />

            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 pointer-events-none sm:block hidden">
                <div
                    className={`w-full bg-gradient-to-b ${getOccupancyColor(occupancyRate)} transition-all duration-700`}
                    style={{ height: `${occupancyRate}%`, position: "absolute", bottom: 0 }}
                />
            </div>

            <div className="relative flex flex-row p-3 lg:flex-col lg:p-4 h-full gap-3 lg:gap-0">
                {/* Photo */}
                <div className="relative w-24 lg:w-full h-28 lg:h-32 rounded-xl overflow-hidden lg:mb-3 bg-white/60 flex-shrink-0">
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

                    {/* Type & Subtype Overlay */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                        {property.property_type && (
                            <span className="px-1.5 py-0.5 text-[9px] lg:text-[10px] font-bold text-white bg-blue-600/90 rounded-md capitalize backdrop-blur-sm">
                                {property.property_type.replaceAll("_", " ")}
                            </span>
                        )}
                        {property.property_subtype && (
                            <span className="px-1.5 py-0.5 text-[9px] lg:text-[10px] font-semibold text-white bg-emerald-600/90 rounded-md capitalize backdrop-blur-sm">
                                {property.property_subtype.replaceAll("_", " ")}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex-1">
                        {/* Name */}
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">
                            {property.property_name || "Unnamed Property"}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center text-gray-500 text-xs mb-2 lg:mb-3">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="line-clamp-1">
                                {[property.city, property.province]
                                    .filter(Boolean)
                                    .join(", ") || "No address"}
                            </span>
                        </div>

                        {/* Occupancy */}
                        <div className="mb-2 lg:mb-3">
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
                    <div className="flex lg:mt-3 mt-2 gap-2 w-full">
                        <button
                            onClick={handleView}
                            className="flex-1 flex items-center justify-center gap-1 py-2 lg:py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm hover:shadow-md transition-all"
                        >
                            <Home className="w-3.5 h-3.5" />
                            View
                        </button>
                        <button
                            onClick={handleEdit}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors lg:flex-none lg:p-2 lg:py-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span className="lg:hidden">Edit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors lg:flex-none lg:p-2 lg:py-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="lg:hidden">Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
