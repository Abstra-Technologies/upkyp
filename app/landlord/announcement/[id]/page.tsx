"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

export default function ViewAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user, fetchSession } = useAuthStore();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnnouncement() {
      if (!user?.landlord_id || !id) return;

      try {
        const response = await fetch(
          `/api/landlord/announcement/viewAnnouncementbyId?id=${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch announcement");
        const data = await response.json();
        setAnnouncement(data);

        // Fetch images - they come already decrypted from the API
        const imagesResponse = await fetch(
          `/api/landlord/announcement/getAnnouncementImages?id=${id}`
        );
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          console.log("Images from API:", imagesData); // Debug log
          // Images are already decrypted by the API (server-side)
          setImages(imagesData);
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
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

    if (user?.landlord_id && id) {
      fetchAnnouncement();
    }
  }, [user, id]);

  const handleEdit = () => {
    router.push(`/pages/landlord/announcement/edit/${id}`);
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Announcement?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/landlord/announcement/deleteAnnouncement?id=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete announcement");

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Announcement has been deleted.",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        timerProgressBar: true,
      });

      router.push("/pages/landlord/announcement");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to delete announcement.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse mb-3" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>

            {/* Images Skeleton */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 sm:h-36 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Announcement Not Found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            The announcement you're looking for doesn't exist.
          </p>
          <Link
            href="/pages/landlord/announcement"
            className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: pt-20 for top navbar + pb-24 for bottom nav | Desktop: normal padding */}
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

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {announcement.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 rounded-md font-medium border border-blue-100">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {announcement.property}
                </span>
                <span className="flex items-center gap-1">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(announcement.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-4">
              <button
                onClick={handleEdit}
                className="flex-1 sm:flex-none px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            <div className="prose max-w-none">
              <div
                className="text-gray-700 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: announcement.description }}
              />
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                  Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {images.map((image, index) => (
                    <div
                      key={`${image.photo_id}-${index}`}
                      onClick={() => setSelectedImage(image.photo_url)}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={image.photo_url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 sm:h-36 object-cover"
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            image.photo_url
                          );
                          e.currentTarget.src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" font-size="14" text-anchor="middle" dy=".3em" fill="%239ca3af">Failed to load</text></svg>';
                        }}
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {announcement.updated_at &&
          announcement.updated_at !== announcement.created_at && (
            <div className="mt-4 text-xs sm:text-sm text-gray-500">
              Last updated: {formatDate(announcement.updated_at)}
            </div>
          )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-lg p-2"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8"
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
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
