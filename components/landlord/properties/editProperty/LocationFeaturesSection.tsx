"use client";

import dynamic from "next/dynamic";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import AmenitiesSelector from "@/components/landlord/createProperty/amenities-selector";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { useState } from "react";
import { Check } from "lucide-react";

const PropertyMapWrapper = dynamic(
    () => import("@/components/landlord/createProperty/propertyMapWrapper"),
    { ssr: false }
);

export default function LocationFeaturesSection() {
    const { property, setProperty } = useEditPropertyStore();

    const [coords, setCoords] = useState({
        lat: property?.lat || null,
        lng: property?.lng || null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty({ [name]: value });
    };

    const toggleAmenity = (amenity) => {
        const list = property.amenities || [];
        const updated = list.includes(amenity)
            ? list.filter((a) => a !== amenity)
            : [...list, amenity];

        setProperty({ amenities: updated });
    };

    const togglePreference = (key) => {
        const list = property.propertyPreferences || [];
        const updated = list.includes(key)
            ? list.filter((x) => x !== key)
            : [...list, key];

        setProperty({ propertyPreferences: updated });
    };

    // @ts-ignore
    return (
        <div className="space-y-4">

            {/* MAP */}
            <div>
                <label className="text-sm font-semibold">Location</label>
                <div className="mt-1 h-64 border rounded-xl overflow-hidden">
                    <PropertyMapWrapper
                        coordinates={
                            coords.lat && coords.lng ? [coords.lat, coords.lng] : null
                        }
                        setFields={(data) => {
                            setCoords({ lat: data.latitude, lng: data.longitude });
                            setProperty(data);
                        }}
                    />
                </div>
            </div>

            {/* ADDRESS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-semibold">Street</label>
                    <input
                        name="street"
                        value={property.street || ""}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>

                <div>
                    <label className="text-sm font-semibold">City</label>
                    <input
                        name="city"
                        value={property.city || ""}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>

                <div>
                    <label className="text-sm font-semibold">Province</label>
                    <input
                        name="province"
                        value={property.province || ""}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>

                <div>
                    <label className="text-sm font-semibold">ZIP Code</label>
                    <input
                        name="zipCode"
                        value={property.zipCode || ""}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>
            </div>

            {/* AMENITIES */}
            <div>
                <label className="text-sm font-semibold">Amenities</label>
                <div className="mt-2">
                    <AmenitiesSelector
                        selectedAmenities={property.amenities || []}
                        onAmenityChange={toggleAmenity}
                    />
                </div>
            </div>

            {/* PREFERENCES */}
            <div>
                <label className="text-sm font-semibold">Property Preferences</label>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                    {PROPERTY_PREFERENCES.map((pref) => {
                        const active = property.propertyPreferences?.includes(pref.key);
                        const Icon = pref.icon; // ✅ IMPORTANT

                        return (
                            <button
                                key={pref.key}
                                onClick={() => togglePreference(pref.key)}
                                className={`
            relative
            flex flex-col items-center justify-center
            h-[60px] sm:h-[68px]
            px-1 py-1
            rounded-md
            border
            text-[9px] sm:text-[11px]
            font-medium
            transition-all duration-150
            active:scale-95
            ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                }
          `}
                            >
                                {/* CHECK */}
                                {active && (
                                    <span className="absolute top-0.5 right-0.5 bg-white text-blue-600 rounded-full p-[1px]">
              <Check className="w-2 h-2" />
            </span>
                                )}

                                {/* ✅ ICON FIX */}
                                <span className="text-sm leading-none">
            <Icon className="w-4 h-4" />
          </span>

                                {/* LABEL */}
                                <span className="mt-0.5 text-center leading-tight line-clamp-2">
            {pref.label}
          </span>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}