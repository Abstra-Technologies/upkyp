"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";
import "react-quill-new/dist/quill.snow.css";

const MAX_IMAGES = 10;

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function CreateAnnouncement() {
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    properties: [] as string[],
    subject: "",
    description: "",
  });

  useEffect(() => {
    async function fetchProperties() {
      try {
        if (!user?.landlord_id) return;
        const response = await fetch(
          `/api/landlord/${user.landlord_id}/properties`
        );
        if (!response.ok) throw new Error("Failed to fetch properties");
        const data = await response.json();
        setProperties(
          data.success && Array.isArray(data.data) ? data.data : []
        );
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load properties. Please try again.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id) fetchProperties();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (formData.properties.length === 0) {
      setError("Please select at least one property");
      return false;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.description.replace(/<[^>]+>/g, "").trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formData.properties.forEach((id) =>
        formDataToSend.append("property_ids[]", id)
      );
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("landlord_id", user.landlord_id);

      uploadedImages.forEach((file) => formDataToSend.append("images", file));

      const response = await fetch(
        "/api/landlord/announcement/createAnnouncement",
        { method: "POST", body: formDataToSend }
      );
      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Announcement created successfully.",
          confirmButtonColor: "#3b82f6",
          timer: 2000,
          timerProgressBar: true,
        });
        setFormData({ properties: [], subject: "", description: "" });
        setUploadedImages([]);
        router.replace("/pages/landlord/announcement");
      } else {
        throw new Error(data.message || "Failed to create announcement");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create announcement");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create announcement. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasContent =
      formData.properties.length > 0 ||
      formData.subject.trim() ||
      formData.description.replace(/<[^>]+>/g, "").trim() ||
      uploadedImages.length > 0;

    if (hasContent) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved content. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Discard",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) router.push("/pages/landlord/announcement");
      });
    } else {
      router.push("/pages/landlord/announcement");
    }
  };

  const toggleProperty = (propertyId: string) => {
    setFormData((prev) => {
      const alreadySelected = prev.properties.includes(propertyId);
      return {
        ...prev,
        properties: alreadySelected
          ? prev.properties.filter((id) => id !== propertyId)
          : [...prev.properties, propertyId],
      };
    });
    if (error) setError("");
  };

  const toggleSelectAll = () => {
    if (!properties || properties.length === 0) return;
    const allPropertyIds = properties.map((p) => String(p.property_id));
    setFormData((prev) => ({
      ...prev,
      properties:
        prev.properties.length === allPropertyIds.length ? [] : allPropertyIds,
    }));
    if (error) setError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - uploadedImages.length;

    if (remainingSlots <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Image Limit Reached",
        text: `Maximum ${MAX_IMAGES} images allowed per announcement.`,
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setUploadedImages((prev) => [
      ...prev,
      ...newFiles.slice(0, remainingSlots),
    ]);
  };

  const handleDeleteImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-4" />
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>

          {/* Form Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="space-y-6">
              {/* Property Selection Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Subject Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Description Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse mb-2" />
                <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Images Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Actions Skeleton */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/pages/landlord/announcement"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Announcements
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Announcement
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Share updates with your tenants
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Select Properties <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {formData.properties.length === properties.length &&
                    properties.length > 0
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {properties.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No properties available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {properties.map((property) => {
                        const idStr = String(property.property_id);
                        const isChecked = formData.properties.includes(idStr);
                        return (
                          <label
                            key={idStr}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200"
                                : "hover:bg-gray-50 border-2 border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={idStr}
                              checked={isChecked}
                              onChange={() => toggleProperty(idStr)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {property.property_name}
                              </div>
                              {(property.city || property.province) && (
                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                  {[property.city, property.province]
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {formData.properties.length} of {properties.length} selected
                </p>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter announcement subject"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                  className="bg-white border border-gray-300 rounded-lg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.replace(/<[^>]+>/g, "").length}{" "}
                  characters
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Images (Optional) - Max {MAX_IMAGES}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadedImages.length >= MAX_IMAGES}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${
                      uploadedImages.length >= MAX_IMAGES
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      {uploadedImages.length >= MAX_IMAGES
                        ? "Maximum images reached"
                        : "Click to upload images"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </label>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {uploadedImages.map((file, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {saving ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Announcement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
