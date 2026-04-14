"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import {
  Plus,
  X,
  Home,
  Ruler,
  DollarSign,
  Camera,
  Eye,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import furnishingTypes from "@/constant/furnishingTypes";
import unitTypes from "@/constant/unitTypes";
import AmenitiesSelector from "@/components/landlord/properties/unitAmenities";
import DisableNavigation from "@/components/navigation/DisableNavigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { createUnitSteps } from "@/lib/onboarding/createUnit";

// Zod validation schema
const unitSchema = z.object({
  unitName: z.string().min(1, "Unit name is required"),
  unitSize: z.string().min(1, "Unit Size is required"),
  rentAmt: z.number().min(1, "Rent amount is required"),
  furnish: z.string().min(1, "Furnishing selection is required"),
  photos: z.array(z.any()).min(1, "At least one image is required"),
});

// Section Header Component
function SectionHeader({
  number,
  icon: Icon,
  title,
  subtitle,
}: {
  number: number;
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {title}
          </h3>
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
  icon: Icon,
  required = false,
  error,
  suffix,
  prefix,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: any;
  required?: boolean;
  error?: string;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-blue-600" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${prefix ? "pl-9" : "px-3 sm:px-4"} ${suffix ? "pr-14" : "pr-3 sm:pr-4"} py-2.5 sm:py-3 text-sm sm:text-base border rounded-xl transition-all outline-none ${
            error
              ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          }`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function UnitListingForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    property_id: propertyId || "",
    unitName: "",
    unitSize: "",
    rentAmt: "",
    furnish: "",
    amenities: [],
    unitType: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [unitNameError, setUnitNameError] = useState("");

  // 360° States
  const [is360Enabled, setIs360Enabled] = useState(false);
  const [photo360, setPhoto360] = useState<File | null>(null);
  const [preview360, setPreview360] = useState("");

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "create-unit",
    steps: createUnitSteps,
    autoStart: true,
  });

  useEffect(() => {
    const fetchPropertyName = async () => {
      if (!propertyId) return;
      try {
        const res = await fetch(
          `/api/propertyListing/getPropDetailsById?property_id=${propertyId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch property");
        const data = await res.json();
        setPropertyName(data.property.property_name);
      } catch {
        setPropertyName("Unknown Property");
      }
    };
    fetchPropertyName();
  }, [propertyId]);

  // Load 360 Viewer
    useEffect(() => {
        if (!preview360) return;

        let viewer: any;
        let destroyed = false;

        const initViewer = async () => {
            const container = document.getElementById("viewer360");
            if (!container) return;

            const { Viewer } = await import("@photo-sphere-viewer/core");

            if (destroyed) return;

            viewer = new Viewer({
                container,
                panorama: preview360, // blob URL is OK
                loadingTxt: "Loading 360° view...",
                navbar: ["zoom", "fullscreen", "autorotate"],
                defaultZoomLvl: 50,
            });
        };

        initViewer();

        return () => {
            destroyed = true;
            if (viewer) {
                viewer.destroy();
                viewer = null;
            }
        };
    }, [preview360]);


    const handleAmenityChange = (amenityName: string) => {
    setFormData((prev) => {
      const isSelected = prev.amenities.includes(amenityName);
      return {
        ...prev,
        amenities: isSelected
          ? prev.amenities.filter((a) => a !== amenityName)
          : [...prev.amenities, amenityName],
      };
    });
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "unitName" && value.trim() !== "") {
      try {
        const res = await fetch(
          `/api/unitListing/checkUnitName?property_id=${propertyId}&unitName=${encodeURIComponent(
            value.trim(),
          )}`,
        );
        const data = await res.json();
        setUnitNameError(
          data.exists ? "This unit name is already in use." : "",
        );
      } catch {}
    }
  };

  // Dropzone for regular photos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      setPhotos((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return; // 🔒 prevent double click

        const result = unitSchema.safeParse({
            ...formData,
            rentAmt: Number(formData.rentAmt),
            photos,
        });

        /* ================= VALIDATION ================= */
        if (!result.success) {
            const messages =
                result.error?.issues?.map((issue) => issue.message).join(", ") ||
                "Please fill in all required fields.";

            await Swal.fire({
                title: "Validation Error",
                text: messages,
                icon: "error",
                confirmButtonColor: "#ef4444",
            });

            return;
        }

        /* ================= CONFIRMATION ================= */
        const confirmSubmit = await Swal.fire({
            title: "Create Unit?",
            text: "Do you want to submit this unit listing?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, create it!",
            allowOutsideClick: false,
            allowEscapeKey: false,
        });

        if (!confirmSubmit.isConfirmed) return;

        setLoading(true);

        /* ================= LOCKED LOADING MODAL ================= */
        Swal.fire({
            title: "Creating Unit...",
            html: `
      <div class="flex flex-col items-center gap-3">
        <div class="text-gray-500 text-sm">
          Please wait while we save your unit listing.
        </div>
      </div>
    `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const form = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, String(value));
            });

            photos.forEach((photo) => {
                form.append("photos", photo);
            });

            if (photo360) {
                form.append("photo360", photo360);
            }

            await axios.post("/api/unitListing/addUnit", form);

            /* ================= SUCCESS ================= */
            await Swal.fire({
                title: "Success!",
                text: "Unit created successfully!",
                icon: "success",
                confirmButtonColor: "#10b981",
                allowOutsideClick: false,
                allowEscapeKey: false,
            });

            router.replace(`/pages/landlord/properties/${propertyId}`);
        } catch (error: any) {
            /* ================= FAILURE ================= */
            await Swal.fire({
                title: "Error!",
                text:
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to create unit.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleCancel = () => {
    Swal.fire({
      title: "Discard Changes?",
      text: "Any unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, discard",
      cancelButtonText: "Keep editing",
    }).then((res) => {
      if (res.isConfirmed)
        router.replace(`/pages/landlord/properties/${propertyId}`);
    });
  };

  return (
    <>
      <DisableNavigation />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 pb-20 md:pb-8">
        <div className="px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  Create New Unit:{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    {propertyName}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Add a new unit to your property
                </p>
              </div>

              {/* Help Button */}
              <button
                onClick={startTour}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            </div>
          </div>

          {/* FORM CONTAINER */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-gray-200/50 border border-gray-100 mb-4 sm:mb-6">
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-5 md:p-6 space-y-8"
            >
              {/* ===== BASIC INFORMATION ===== */}
              <div id="basic-info-section">
                <SectionHeader
                  number={1}
                  icon={Home}
                  title="Basic Information"
                  subtitle="Essential details about your unit"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div id="unit-name-input">
                    <InputField
                      label="Unit Name"
                      name="unitName"
                      value={formData.unitName}
                      onChange={handleChange}
                      placeholder="e.g., Unit 101"
                      icon={Home}
                      required
                      error={unitNameError}
                    />
                  </div>

                  <InputField
                    label="Unit Size"
                    name="unitSize"
                    value={formData.unitSize}
                    onChange={handleChange}
                    placeholder="25"
                    type="number"
                    icon={Ruler}
                    required
                    suffix="sqm"
                  />

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      Unit Type
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unitType"
                      value={formData.unitType}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="" disabled>
                        Select unit type
                      </option>
                      {unitTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <InputField
                    label="Monthly Rent"
                    name="rentAmt"
                    value={formData.rentAmt}
                    onChange={handleChange}
                    placeholder="5000"
                    type="number"
                    icon={DollarSign}
                    required
                    prefix="₱"
                  />
                </div>
              </div>

              {/* ===== UNIT FEATURES ===== */}
              <div id="unit-features-section">
                <SectionHeader
                  number={2}
                  icon={Sparkles}
                  title="Unit Features"
                  subtitle="Furnishing type and amenities"
                />

                {/* Furnishing */}
                <div className="space-y-1.5 mb-4">
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Furnishing Type
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="furnish"
                    value={formData.furnish}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>
                      Select furnishing type
                    </option>
                    {furnishingTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">
                    Amenities
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 border border-gray-200 rounded-xl">
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>
              </div>

              {/* ===== UNIT PHOTOS ===== */}
              <div id="unit-photos-section">
                <SectionHeader
                  number={3}
                  icon={Camera}
                  title="Unit Photos"
                  subtitle="Add photos to showcase your unit (min 1 required)"
                />

                {/* Upload Zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed p-6 sm:p-8 rounded-xl cursor-pointer transition-all ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50 shadow-inner"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                      <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                      {isDragActive ? "Drop images here" : "Drag & drop images"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      or click to browse • PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>

                {/* Photo Grid */}
                {photos.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}{" "}
                        uploaded
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
                        >
                          <Image
                            src={URL.createObjectURL(photo)}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            alt={`Unit photo ${index + 1}`}
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...photos];
                              updated.splice(index, 1);
                              setPhotos(updated);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Photo Number */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-md">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Action Buttons - Sticky on mobile */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden sticky bottom-4 md:static z-50">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                {/* Cancel */}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg sm:rounded-xl transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Cancel</span>
                </button>

                {/* Create Unit */}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !!unitNameError}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Create Unit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
