"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import AmenitiesSelector from "./amenities-selector";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  FileText,
  Ruler,
  Heart,
  Zap,
  ImagePlus,
  Camera,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

const PropertyMapWrapper = dynamic(() => import("./propertyMapWrapper"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

// Map loading skeleton
function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({
  number,
  icon: Icon,
  title,
  subtitle,
  required,
}: {
  number: number;
  icon: any;
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
            {title}
          </h3>
          {required && (
            <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              Required
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  required = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-xl transition-all outline-none ${
          readOnly
            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
            : "border-gray-300 bg-gray-100 lg:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        }`}
      />
    </div>
  );
}

export default function StepOneCreateProperty() {
  const { property, setProperty, photos, setPhotos } = usePropertyStore();
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

  const [coords, setCoords] = useState({
    lat: property?.latitude ?? null,
    lng: property?.longitude ?? null,
  });

  const [loadingAI, setLoadingAI] = useState(false);

  /* =========================================================
     HANDLERS
  ========================================================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  const togglePreference = (key: string) => {
    const prefs = property.propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: prefs.includes(key)
        ? prefs.filter((v) => v !== key)
        : [...prefs, key],
    });
  };

  const toggleAmenity = (amenity: string) => {
    const arr = property.amenities || [];
    setProperty({
      ...property,
      amenities: arr.includes(amenity)
        ? arr.filter((x) => x !== amenity)
        : [...arr, amenity],
    });
  };

  /* =========================================================
     PHOTO HANDLERS
  ========================================================= */
  const onDrop = (acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        multiple: true,
        maxSize: MAX_PHOTO_SIZE,
        onDrop: (acceptedFiles, fileRejections) => {
            // ❌ Handle rejected files (too large / invalid)
            if (fileRejections.length > 0) {
                const oversized = fileRejections.find((rej) =>
                    rej.errors.some((e) => e.code === "file-too-large")
                );

                if (oversized) {
                    Swal.fire({
                        icon: "error",
                        title: "File too large",
                        text: "Each photo must be 10MB or less.",
                        confirmButtonColor: "#ef4444",
                    });
                }
            }

            // ✅ Accept valid files
            if (acceptedFiles.length > 0) {
                const newPhotos = acceptedFiles.map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                }));

                setPhotos([...photos, ...newPhotos]);
            }
        },
    });


    const removePhoto = (index: number) => {
    const photo = photos[index];
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  /* =========================================================
     AI DESCRIPTION
  ========================================================= */
  const handleGenerateDescription = async () => {
    setLoadingAI(true);

    const p = property;
    const prompt = `
Create a compelling, concise property description (under 150 words) based on:
Name: ${p.propertyName}
Type: ${p.propertyType}
Amenities: ${p.amenities?.join(", ") || "None"}
Address: ${p.street}, ${p.brgyDistrict}, ${p.city}, ${p.zipCode}, ${p.province}
Floor Area: ${p.floorArea} sqm
`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content:
                "You are a real estate assistant. Write concise, appealing property descriptions.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) setProperty({ ...property, propDesc: text });
    } catch {
      alert("Failed to generate description");
    }

    setLoadingAI(false);
  };

  /* =========================================================
     MAP CALLBACK
  ========================================================= */
  const mapSetFields = (data: any) => {
    if (!data) return;

    setProperty({
      ...property,
      street: data.street || "",
      brgyDistrict: data.brgyDistrict || "",
      city: data.city || "",
      province: data.province || "",
      zipCode: data.zipCode || "",
      latitude: data.latitude,
      longitude: data.longitude,
    });

    setCoords({ lat: data.latitude, lng: data.longitude });
  };

  /* =========================================================
     RENDER
  ========================================================= */
    return (
        <div className="space-y-6 sm:space-y-8 lg:bg-gradient-to-br lg:from-gray-50 lg:via-blue-50/30 lg:to-emerald-50/30 lg:p-6 lg:rounded-2xl">

            {/* ===================================================== */}
            {/* 1️⃣ PROPERTY TYPE – SQUARE CARDS */}
            {/* ===================================================== */}
            <div id="property-type-section" className="space-y-3">
                <SectionHeader
                    number={1}
                    icon={Building2}
                    title="Property Type"
                    subtitle="Select the type that best describes your property"
                    required
                />

                <div className="
    grid
    grid-cols-3
    sm:grid-cols-4
    md:grid-cols-5
    gap-2
    sm:gap-3
    max-w-2xl
  ">
                    {PROPERTY_TYPES.map((type) => {
                        const active = property.propertyType === type.value;

                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setProperty({ propertyType: type.value })}
                                className={`
            relative
            h-20 sm:h-24 md:h-24
            flex flex-col items-center justify-center
            rounded-lg border
            text-center
            transition-all duration-150
            active:scale-95
            ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                                }
          `}
                            >
                                {active && (
                                    <CheckCircle className="absolute top-1 right-1 w-3.5 h-3.5" />
                                )}

                                <div className="text-lg sm:text-xl">
                                    {type.icon}
                                </div>

                                <p className="text-[11px] sm:text-xs font-medium mt-1 px-1 leading-tight">
                                    {type.label}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>            {/* 2️⃣ PROPERTY NAME */}
            {/* ===================================================== */}
            <div id="property-name-section">
                <SectionHeader
                    number={2}
                    icon={Building2}
                    title="Property Name"
                    subtitle="Give your property a memorable name"
                    required
                />

                <InputField
                    label="Property Name"
                    name="propertyName"
                    value={property.propertyName}
                    onChange={handleChange}
                    placeholder="e.g., Sunshine Residences"
                    required
                />
            </div>

            {/* ===================================================== */}
            {/* 3️⃣ LOCATION */}
            {/* ===================================================== */}
            <div id="location-section">
                <SectionHeader
                    number={3}
                    icon={MapPin}
                    title="Property Location"
                    subtitle="Search or click on the map"
                    required
                />

                <div className="rounded-xl overflow-hidden border border-gray-200 h-56 sm:h-72 md:h-80 mb-4">
                    <PropertyMapWrapper
                        coordinates={
                            coords.lat && coords.lng ? [coords.lat, coords.lng] : null
                        }
                        setFields={mapSetFields}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Street" name="street" value={property.street} onChange={handleChange} required />
                    <InputField label="Barangay / District" name="brgyDistrict" value={property.brgyDistrict} onChange={handleChange} readOnly />
                    <InputField label="City" name="city" value={property.city} onChange={handleChange} required />
                    <InputField label="Province" name="province" value={property.province} onChange={handleChange} readOnly />
                    <InputField label="ZIP Code" name="zipCode" value={property.zipCode} onChange={handleChange} required />
                </div>
            </div>

            {/* ===================================================== */}
            {/* 4️⃣ AMENITIES */}
            {/* ===================================================== */}
            <div id="amenities-section">
                <SectionHeader
                    number={4}
                    icon={CheckCircle}
                    title="Amenities"
                    subtitle="Select all amenities available"
                />

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200
                max-h-[300px] overflow-y-auto">
                    <AmenitiesSelector
                        selectedAmenities={property.amenities || []}
                        onAmenityChange={toggleAmenity}
                    />
                </div>

            </div>

            {/* ===================================================== */}
            {/* 5️⃣ DESCRIPTION (OPTIONAL) */}
            {/* ===================================================== */}
            <div id="description-section">
                <SectionHeader
                    number={5}
                    icon={FileText}
                    title="Description"
                    subtitle="Optional – describe your property"
                />

                <textarea
                    name="propDesc"
                    rows={4}
                    onChange={handleChange}
                    value={property.propDesc || ""}
                    placeholder="Describe what makes your property special..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-gray-100 lg:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
            </div>

            {/* ===================================================== */}
            {/* 6️⃣ FLOOR AREA (OPTIONAL) */}
            {/* ===================================================== */}
            <div id="floor-area-section">
                <SectionHeader
                    number={6}
                    icon={Ruler}
                    title="Property Size"
                    subtitle="Optional – total floor area (sqm)"
                />

                <div className="max-w-full sm:max-w-xs">
                    <InputField
                        label="Floor Area (sqm)"
                        name="floorArea"
                        value={property.floorArea}
                        onChange={handleChange}
                        type="number"
                    />
                </div>
            </div>

            {/* ===================================================== */}
            {/* 7️⃣ PREFERENCES */}
            {/* ===================================================== */}
            <div id="preferences-section">
                <SectionHeader
                    number={7}
                    icon={Heart}
                    title="Property Preferences"
                    subtitle="Set tenant rules"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROPERTY_PREFERENCES.map((pref) => {
                        const Icon = pref.icon;
                        const active = property.propertyPreferences?.includes(pref.key);

                        return (
                            <button
                                key={pref.key}
                                type="button"
                                onClick={() => togglePreference(pref.key)}
                                className={`relative p-3 rounded-lg border text-xs font-medium transition-all ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white border-gray-200 text-gray-700"
                                }`}
                            >
                                {active && (
                                    <CheckCircle className="absolute top-1 right-1 w-3.5 h-3.5" />
                                )}
                                <Icon className="text-lg mx-auto mb-1" />
                                {pref.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ===================================================== */}
            {/* 8️⃣ UTILITY BILLING */}
            {/* ===================================================== */}
            <div id="utility-billing-section" className="space-y-4">
                <SectionHeader
                    number={8}
                    icon={Zap}
                    title="Utility Billing"
                    subtitle="How are utilities billed?"
                    required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* WATER BILLING */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            💧 Water Billing <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="waterBillingType"
                            onChange={handleChange}
                            value={property.waterBillingType || ""}
                            className="
          w-full px-3 py-2.5 text-sm
          border border-gray-200 rounded-xl
          bg-gray-100 lg:bg-gray-200 focus:bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-500 transition-all
        "
                        >
                            <option value="">Select billing type</option>
                            {UTILITY_BILLING_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ELECTRICITY BILLING */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            ⚡ Electricity Billing <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="electricityBillingType"
                            onChange={handleChange}
                            value={property.electricityBillingType || ""}
                            className="
          w-full px-3 py-2.5 text-sm
          border border-gray-200 rounded-xl
          bg-gray-100 lg:bg-gray-200 focus:bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-500 transition-all
        "
                        >
                            <option value="">Select billing type</option>
                            {UTILITY_BILLING_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* INFO BOX */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs sm:text-sm text-blue-700">
                            <p className="font-semibold mb-1">Billing Types Explained:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>
                                    <strong>Submetered:</strong> Each unit has its own meter and tenants pay based on actual usage.
                                </li>
                                <li>
                                    <strong>Inclusive:</strong> Utilities are included in the rent.
                                </li>

                            </ul>
                        </div>
                    </div>
                </div>
            </div>            {/* ===================================================== */}
            {/* 9️⃣ PHOTOS (OPTIONAL) */}
            {/* ===================================================== */}
            <div id="photos-section">
                <SectionHeader
                    number={9}
                    icon={ImagePlus}
                    title="Property Photos"
                    subtitle="Optional – upload images to showcase your property"
                />

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed p-5 rounded-xl transition ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                    }`}
                >
                    <input {...getInputProps()} />
                    <p className="text-sm font-medium text-gray-700 text-center">
                        Drag & drop images or click to upload
                    </p>
                </div>

                {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                        {photos.map((photo: any, index: number) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                <img src={photo.preview} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
