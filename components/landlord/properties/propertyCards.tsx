"use client";

import React from "react";
import Image from "next/image";
import {
    BuildingOffice2Icon,
    HomeIcon,
    PencilSquareIcon,
    TrashIcon,
    MapPinIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    LockClosedIcon,
    UsersIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";

const gradients = [
    "from-blue-100 to-emerald-100",
    "from-violet-100 to-pink-100",
    "from-amber-100 to-orange-100",
    "from-cyan-100 to-sky-100",
    "from-rose-100 to-red-100",
    "from-indigo-100 to-purple-100",
    "from-teal-100 to-green-100",
    "from-fuchsia-100 to-pink-100",
    "from-lime-100 to-emerald-100",
    "from-sky-100 to-blue-100",
    "from-orange-100 to-rose-100",
    "from-purple-100 to-indigo-100",
    "from-emerald-100 to-teal-100",
    "from-pink-100 to-rose-100",
    "from-amber-100 to-yellow-100",
    "from-cyan-100 to-teal-100",
];

const PropertyCard = ({
                          property,
                          index,
                          subscription,
                          handleView,
                          handleEdit,
                          handleDelete,
                      }: any) => {
    const maxProperties = subscription?.limits?.maxProperties ?? null;
    const isLockedByPlan = maxProperties !== null && index + 1 > maxProperties;

    const [gradientBg] = React.useState(() => gradients[Math.floor(Math.random() * gradients.length)]);

    const isRejected = property?.verification_status === "Rejected";
    const isPending = property?.verification_status === "Pending";
    const isVerified = property?.verification_status === "Verified";

    const getStatusConfig = () => {
        if (isLockedByPlan)
            return { badge: "bg-gray-200 text-gray-700", icon: <LockClosedIcon className="w-3 h-3" />, text: "Locked" };
        if (isRejected)
            return { badge: "bg-red-100 text-red-700", icon: <XCircleIcon className="w-3 h-3" />, text: "Rejected" };
        if (isPending)
            return { badge: "bg-yellow-100 text-yellow-700", icon: <ClockIcon className="w-3 h-3" />, text: "Pending" };
        if (isVerified)
            return { badge: "bg-green-100 text-green-700", icon: <CheckCircleIcon className="w-3 h-3" />, text: "Verified" };
        return { badge: "bg-gray-100 text-gray-600", icon: <ClockIcon className="w-3 h-3" />, text: "Unknown" };
    };

    const statusConfig = getStatusConfig();

    const totalUnits = property.total_units || 0;
    const occupiedUnits = property.occupied_units || 0;
    const totalIncome = property.total_income || 0;

    let occupancyRate = 0;
    if (totalUnits > 0) {
        occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);
    }

    const getOccupancyColor = (rate: number) => {
        if (rate >= 80) return "from-emerald-500 to-emerald-400";
        if (rate >= 50) return "from-amber-500 to-amber-400";
        if (rate > 0) return "from-red-500 to-red-400";
        return "from-gray-400 to-gray-300";
    };

    return (
        <div
            className={`group relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br ${gradientBg} ${isLockedByPlan ? "opacity-60 pointer-events-none" : ""}`}
        >
            {/* Battery fill background */}
            <div
                className={`absolute inset-0 bg-gradient-to-t ${getOccupancyColor(occupancyRate)} opacity-[0.08] pointer-events-none`}
                style={{ clipPath: `inset(${100 - occupancyRate}% 0 0 0)` }}
            />

            {/* Left edge battery bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 pointer-events-none">
                <div
                    className={`w-full bg-gradient-to-b ${getOccupancyColor(occupancyRate)} transition-all duration-700`}
                    style={{ height: `${occupancyRate}%`, position: "absolute", bottom: 0 }}
                />
            </div>

            {/* Desktop: Square card layout */}
            <div className="hidden sm:flex relative h-full flex-col p-4">
                {/* Top: Status + Property Image */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3">
                    {property?.photos?.length && property.photos[0]?.photo_url ? (
                        <Image
                            src={property.photos[0].photo_url}
                            alt={property.property_name || "Property image"}
                            width={300}
                            height={200}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/60 flex items-center justify-center">
                            <BuildingOffice2Icon className="h-10 w-10 text-gray-400" />
                        </div>
                    )}

                    {/* Status Badge */}
                    {/*<div className="absolute top-2 left-2">*/}
                    {/*    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${statusConfig.badge}`}>*/}
                    {/*        {statusConfig.icon}*/}
                    {/*        {statusConfig.text}*/}
                    {/*    </span>*/}
                    {/*</div>*/}
                </div>

                {/* Property Name + Location */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">
                        {property.property_name || "Unnamed Property"}
                    </h3>
                    <div className="flex items-center text-gray-500 text-xs mb-3">
                        <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <p className="line-clamp-1">
                            {[property.city, property.province].filter(Boolean).join(", ") || "No address"}
                        </p>
                    </div>

                    {/* Occupancy Battery Bar */}
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
                        <BanknotesIcon className="h-4 w-4 text-blue-600" />
                        <div>
                            <p className="text-[10px] text-gray-500 leading-tight">Monthly Income</p>
                            <p className="text-sm font-bold text-gray-800">₱{totalIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={(e) => handleView(property, e)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm hover:shadow-md transition-all"
                    >
                        <HomeIcon className="w-3.5 h-3.5" />
                        View
                    </button>

                    <button
                        onClick={(e) => handleEdit(property.property_id, e)}
                        className="p-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={(e) => handleDelete(property.property_id, e)}
                        className="p-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Mobile: Compact stack layout */}
            <div className="sm:hidden relative flex flex-col p-3">
                {/* Name + Status */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 flex-1 mr-2">
                        {property.property_name || "Unnamed Property"}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${statusConfig.badge}`}>
                        {statusConfig.icon}
                        {statusConfig.text}
                    </span>
                </div>

                {/* Occupancy Bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Occupancy</span>
                        <span className={`text-xs font-bold bg-gradient-to-r ${getOccupancyColor(occupancyRate)} bg-clip-text text-transparent`}>
                            {occupancyRate}%
                        </span>
                    </div>
                    <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-gray-200/50">
                        <div
                            className={`h-full bg-gradient-to-r ${getOccupancyColor(occupancyRate)} rounded-full transition-all duration-700`}
                            style={{ width: `${occupancyRate}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        {occupiedUnits}/{totalUnits} units
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={(e) => handleView(property, e)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm"
                    >
                        <HomeIcon className="w-3.5 h-3.5" />
                        View
                    </button>

                    <button
                        onClick={(e) => handleEdit(property.property_id, e)}
                        className="p-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={(e) => handleDelete(property.property_id, e)}
                        className="p-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
