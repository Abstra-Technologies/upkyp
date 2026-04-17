"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Image from "next/image";
import { Edit2, Upload, X, Loader2, ArrowLeft } from "lucide-react";
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
    secDeposit: "",
    advancedPayment: "",
    status: "unoccupied",
    amenities: [],
    unitType: "",
  });
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    if (!unitId) return;

    async function fetchData() {
      try {
        // Fetch unit details
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
            secDeposit: unitData.sec_deposit || "",
            advancedPayment: unitData.advanced_payment || "",
            furnish: furnishingTypes.some((p) => p.value === unitData.furnish)
              ? unitData.furnish
              : "",
            amenities: unitData.amenities
              ? unitData.amenities.split(",").map((amenity) => amenity.trim())
              : [],
            unitType: unitData.unit_type || "",
          });

          // Fetch property name
          if (unitData.property_id) {
            try {
              const propRes = await axios.get(
                `/api/propertyListing/getPropDetailsById?property_id=${unitData.property_id}`
              );
              setPropertyName(propRes.data.property.property_name);
            } catch (err) {
              console.error("Error fetching property name:", err);
            }
          }
        } else {
          console.warn("No unit found for the given unit ID.");
        }

        // Fetch unit photos
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
    const amenityIndex = currentAmenities.indexOf(amenity);

    let newAmenities;
    if (amenityIndex > -1) {
      newAmenities = [
        ...currentAmenities.slice(0, amenityIndex),
        ...currentAmenities.slice(amenityIndex + 1),
      ];
    } else {
      newAmenities = [...currentAmenities, amenity];
    }

    setFormData((prev) => ({ ...prev, amenities: newAmenities }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(files);
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    const viewUnitURL = `/landlord/properties/${unit.property_id}`;

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
      // Update unit details
      await axios.put(
        `/api/unitListing/updateUnitListing?id=${unitId}`,
        formData
      );

      // If new photos were selected, upload them
      if (newPhotos.length > 0) {
        const photoFormData = new FormData();
        photoFormData.append("unit_id", unitId);
        newPhotos.forEach((file) => {
          photoFormData.append("files", file);
        });
        await axios.post(`/api/unitListing/addUnit/UnitPhotos`, photoFormData);
      }

      Swal.fire({
        title: "Updated!",
        text: "Unit updated successfully.",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        router.replace(viewUnitURL);
        router.refresh();
      });
    } catch (error) {
      console.error("Error updating unit:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update unit",
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

    try {
      await axios.delete(`/api/unitListing/unitPhoto?id=${photoId}`);
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
    router.push(
      `/landlord/properties/${unit.property_id}`
    );
  };

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading unit details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DisableNavigation />

      <div className="min-h-screen bg-gray-50">
        {/* Proper spacing for navbar */}
        <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Unit</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Editing unit in{" "}
                  <span className="font-semibold">{propertyName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleUpdateUnit} className="p-4 md:p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Unit Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unitName"
                      value={formData.unitName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                    />
                  </div>

                  {/* Unit Size */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Size <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="unitSize"
                        value={formData.unitSize}
                        onChange={handleChange}
                        className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        sqm
                      </span>
                    </div>
                  </div>

                  {/* Unit Type */}
                  {unitTypes && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Unit Type
                      </label>
                      <select
                        name="unitType"
                        value={formData.unitType || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      >
                        <option value="">Select unit type</option>
                        {unitTypes.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Rent Amount */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Monthly Rent <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="rentAmt"
                        value={formData.rentAmt}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Security Deposit */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Security Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="secDeposit"
                        value={formData.secDeposit}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Advanced Payment */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Advanced Payment
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="advancedPayment"
                        value={formData.advancedPayment}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">2</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Unit Features
                  </h2>
                </div>

                {/* Furnishing */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Furnishing Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="furnish"
                    value={formData.furnish}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Amenities
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">3</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Unit Photos
                  </h2>
                </div>

                {/* Current Photos */}
                {photos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Current Photos ({photos.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Photos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Add New Photos
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {newPhotos.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {newPhotos.length} new photo(s) selected
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-5 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditUnit;
