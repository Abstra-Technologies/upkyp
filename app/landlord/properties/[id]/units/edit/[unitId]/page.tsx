"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  Edit2,
  Upload,
  X,
  Loader2,
  Home,
  Ruler,
  DollarSign,
  Camera,
  Trash2,
} from "lucide-react";
import furnishingTypes from "@/constant/furnishingTypes";
import unitTypes from "@/constant/unitTypes";
import AmenitiesSelector from "@/components/landlord/properties/unitAmenities";
import DisableNavigation from "@/components/navigation/DisableNavigation";

const EditUnit = () => {
  const router = useRouter();
  const { unitId } = useParams();

  const [unit, setUnit] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [formData, setFormData] = useState({
    unitName: "",
    unitSize: "",
    rentAmt: "",
    furnish: "",
    status: "unoccupied",
    amenities: [],
    unitType: "",
  });
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    if (!unitId) return;

    async function fetchData() {
      try {
        const { data } = await axios.get(
          `/api/unitListing/getUnitListings?unit_id=${unitId}`
        );

        if (data.length > 0) {
          const unitData = data[0];

          setUnit(unitData);
          setFormData({
            unitName: unitData.unit_name || "",
            unitSize: unitData.unit_size || "",
            rentAmt: unitData.rent_amount || "",
            furnish: furnishingTypes.some((p) => p.value === unitData.furnish)
              ? unitData.furnish
              : "",
            amenities: unitData.amenities
              ? unitData.amenities.split(",").map((a) => a.trim())
              : [],
            unitType: unitData.unit_type || "",
          });

          if (unitData.property_id) {
            const propRes = await axios.get(
              `/api/propertyListing/getPropDetailsById?property_id=${unitData.property_id}`
            );
            setPropertyName(propRes.data.property.property_name);
          }
        }

        const { data: photoData } = await axios.get(
          `/api/unitListing/getUnitPhotos?unit_id=${unitId}`
        );
        setPhotos(photoData || []);
      } catch (error) {
        console.error("Error fetching unit:", error);
      }
    }

    fetchData();
  }, [unitId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAmenityChange = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities)
      ? formData.amenities
      : [];
    const exists = currentAmenities.includes(amenity);
    setFormData((prev) => ({
      ...prev,
      amenities: exists
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity],
    }));
  };

  const handleFileChange = (e) => {
    setNewPhotos(Array.from(e.target.files));
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();

    const viewUnitURL = `/pages/landlord/properties/${unit.property_id}`;

    const result = await Swal.fire({
      title: "Update Unit?",
      text: "Do you want to save these changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update it!",
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("unitName", formData.unitName || "");
      formDataToSend.append("unitSize", formData.unitSize || "");
      formDataToSend.append("rentAmt", formData.rentAmt || "");
      formDataToSend.append("furnish", formData.furnish || "");
      formDataToSend.append("unitType", formData.unitType || "");
      formDataToSend.append("status", formData.status || "unoccupied");
      formDataToSend.append("amenities", (formData.amenities || []).join(","));

      if (newPhotos && newPhotos.length > 0) {
        newPhotos.forEach((file) => {
          if (file instanceof File) formDataToSend.append("files", file);
        });
      }

      await axios.put(
        `/api/unitListing/updateUnitListing?id=${unitId}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      await Swal.fire({
        title: "Updated!",
        text: "Unit and photos updated successfully.",
        icon: "success",
        confirmButtonColor: "#10b981",
      });

      router.replace(viewUnitURL);
      router.refresh();
    } catch (error) {
      console.error("❌ Error updating unit:", error);

      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to update unit. Please try again.";

      Swal.fire({
        title: "Error",
        text: errorMsg,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const result = await Swal.fire({
      title: "Delete Photo?",
      text: "This photo will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    console.log('photo if ui: ', photoId);

    try {
      await axios.delete(`/api/unitListing/deleteUnitPhoto?id=${photoId}`);
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      Swal.fire({
        title: "Deleted!",
        text: "The photo has been deleted.",
        icon: "success",
        confirmButtonColor: "#10b981",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to delete photo",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const handleCancel = () => {
    router.push(`/pages/landlord/properties/${unit.property_id}`);
  };

  if (!unit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Form Container Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Section 1 */}
            <div className="p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-5 md:p-6 space-y-5 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Section 3 - Photos */}
            <div className="p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="p-5 md:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-12 flex-1 sm:flex-initial sm:w-32 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-12 flex-1 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DisableNavigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
                <Edit2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Edit Unit
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Editing unit in{" "}
                  <span className="font-semibold text-gray-900">
                    {propertyName}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <form
              onSubmit={handleUpdateUnit}
              className="divide-y divide-gray-100"
            >
              {/* Basic Information */}
              <div className="p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    1
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Unit Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      Unit Name *
                    </label>
                    <input
                      type="text"
                      name="unitName"
                      value={formData.unitName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g., Unit 101"
                    />
                  </div>

                  {/* Unit Size */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      Unit Size *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="unitSize"
                        value={formData.unitSize}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-14 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="25"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        sqm
                      </span>
                    </div>
                  </div>

                  {/* Unit Type */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      Unit Type *
                    </label>
                    <select
                      name="unitType"
                      value={formData.unitType || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="">Select unit type</option>
                      {unitTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rent Amount */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Monthly Rent *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="rentAmt"
                        value={formData.rentAmt}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Features */}
              <div className="p-5 md:p-6 space-y-5 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    2
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Unit Features
                  </h2>
                </div>

                {/* Furnishing */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Furnishing Type *
                  </label>
                  <select
                    name="furnish"
                    value={formData.furnish}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="">Select furnishing type</option>
                    {furnishingTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Amenities
                  </label>
                  <div className="bg-white p-4 border border-gray-200 rounded-xl">
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    3
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Unit Photos
                  </h2>
                </div>

                {/* Existing Photos */}
                {photos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Current Photos ({photos.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square"
                        >
                          <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <Image
                              src={photo.photo_url}
                              alt="Unit photo"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                            <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Photos */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Add New Photos
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      id="photo-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload photos
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </label>
                  </div>
                  {newPhotos.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">
                        {newPhotos.length} new photo(s) ready to upload
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 md:p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 sm:flex-initial px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditUnit;
