"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";
import "react-quill-new/dist/quill.snow.css";

const MAX_IMAGES = 10;

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function EditAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user, fetchSession } = useAuthStore();

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    property_id: "",
  });
  const [properties, setProperties] = useState([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    async function fetchData() {
      if (!user?.landlord_id || !id) return;

      try {
        const announcementRes = await fetch(
          `/api/landlord/announcement/viewAnnouncementbyId?id=${id}`
        );
        if (!announcementRes.ok)
          throw new Error("Failed to fetch announcement");
        const announcementData = await announcementRes.json();

        const propertiesRes = await fetch(
          `/api/landlord/${user?.landlord_id}/properties`
        );
        if (!propertiesRes.ok) throw new Error("Failed to fetch properties");
        const propertiesData = await propertiesRes.json();

        const propertiesArray = Array.isArray(propertiesData)
          ? propertiesData
          : propertiesData.properties || propertiesData.data || [];

        const imagesRes = await fetch(
          `/api/landlord/announcement/getAnnouncementImages?id=${id}`
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          setExistingImages(imagesData);
        }

        const initialData = {
          subject: announcementData.subject,
          description: announcementData.description,
          property_id: announcementData.property_id,
        };

        setFormData(initialData);
        setOriginalData(initialData);
        setProperties(propertiesArray);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load announcement data.");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Unable to load announcement details.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, id]);

  useEffect(() => {
    const changed =
      JSON.stringify(formData) !== JSON.stringify(originalData) ||
      newImages.length > 0 ||
      imagesToDelete.length > 0;
    setHasChanges(changed);
  }, [formData, originalData, newImages, imagesToDelete]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.property_id) {
      setError("Please select a property");
      return false;
    }

    const totalImages =
      existingImages.length - imagesToDelete.length + newImages.length;
    if (totalImages > MAX_IMAGES) {
      setError(`Total images cannot exceed ${MAX_IMAGES}`);
      return false;
    }

    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentImageCount =
        existingImages.length - imagesToDelete.length + newImages.length;
      const remainingSlots = MAX_IMAGES - currentImageCount;

      if (remainingSlots <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Image Limit Reached",
          text: `Maximum ${MAX_IMAGES} images allowed.`,
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      if (files.length > remainingSlots) {
        Swal.fire({
          icon: "warning",
          title: "Too Many Images",
          text: `You can only add ${remainingSlots} more image(s).`,
          confirmButtonColor: "#3b82f6",
        });
        setNewImages((prev) => [...prev, ...files.slice(0, remainingSlots)]);
      } else {
        setNewImages((prev) => [...prev, ...files]);
      }
    }
  };

  const handleDeleteNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMarkExistingImageForDelete = (photoId: number) => {
    setImagesToDelete((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("property_id", formData.property_id);

      imagesToDelete.forEach((id) =>
        formDataToSend.append("deleteImageIds[]", String(id))
      );

      newImages.forEach((file) => formDataToSend.append("images", file));

      const response = await fetch(
        `/api/landlord/announcement/updateAnnouncement?id=${id}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update announcement");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Announcement updated successfully.",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        timerProgressBar: true,
      });

      router.push(`/pages/landlord/announcement/${id}`);
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      setError(error.message || "Failed to update announcement");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Unable to update announcement.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved changes.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Discard",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/pages/landlord/announcement/${id}`);
        }
      });
    } else {
      router.push(`/pages/landlord/announcement/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-4" />
            <div className="h-8 bg-gray-200 rounded w-56 animate-pulse" />
          </div>

          {/* Form Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="space-y-6">
              {/* Property Dropdown Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Actions Skeleton */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const currentImageCount =
    existingImages.length - imagesToDelete.length + newImages.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/pages/landlord/announcement/${id}`}
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
            Back to Announcement
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Edit Announcement
          </h1>
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
              {/* Property */}
              <div>
                <label
                  htmlFor="property_id"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property: any) => (
                    <option
                      key={property.property_id}
                      value={property.property_id}
                    >
                      {property.property_name}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                  required
                />
              </div>

              {/* Description (React Quill) */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <ReactQuill
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  theme="snow"
                  className="bg-white border border-gray-300 rounded-lg"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Images - {currentImageCount}/{MAX_IMAGES}
                </label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {existingImages.map((image) => (
                        <div
                          key={image.photo_id}
                          onClick={() =>
                            handleMarkExistingImageForDelete(image.photo_id)
                          }
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            imagesToDelete.includes(image.photo_id)
                              ? "border-red-500 opacity-50"
                              : "border-gray-200 hover:border-blue-400"
                          }`}
                        >
                          <img
                            src={image.photo_url}
                            alt="Announcement"
                            className="w-full h-24 object-cover"
                          />
                          {imagesToDelete.includes(image.photo_id) && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                Will Delete
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {currentImageCount < MAX_IMAGES && (
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
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
                        <p className="text-sm text-gray-600">Add more images</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {MAX_IMAGES - currentImageCount} slot(s) remaining
                        </p>
                      </label>
                    </div>

                    {newImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {newImages.map((file, index) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden border-2 border-emerald-200"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteNewImage(index)}
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
                            <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                              NEW
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  disabled={saving || !hasChanges}
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
                      Saving...
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
    </div>
  );
}
