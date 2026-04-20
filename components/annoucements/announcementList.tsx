"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";
import {
  MegaphoneIcon,
  CalendarIcon,
  ClockIcon,
  PhotoIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface AnnouncementPhoto {
  photo_id: number;
  photo_url: string;
  created_at: string;
}

interface Announcement {
  unique_id: string;
  announcement_id: number | null;
  title: string;
  message: string;
  created_at: string;
  updated_at: string | null;
  photos: AnnouncementPhoto[];
  image_url: string | null;
  source: "system" | "landlord";
  priority?: "urgent" | "important" | "normal";
}

export default function Announcements({
  user_id,
  agreement_id,
}: {
  user_id: number;
  agreement_id?: number;
}) {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const queryParams = new URLSearchParams({
          user_id: user_id.toString(),
        });
        if (agreement_id)
          queryParams.append("agreement_id", agreement_id.toString());

        const response = await axios.get(
          `/api/tenant/announcement/allAnnouncements?${queryParams.toString()}`
        );

        const sortedAnnouncements = response.data.sort(
          (a: Announcement, b: Announcement) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAnnouncements(sortedAnnouncements);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    if (user_id) fetchAnnouncements();
  }, [user_id, agreement_id]);

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const nextPhoto = (photos: AnnouncementPhoto[]) => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (photos: AnnouncementPhoto[]) => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const openModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setCurrentPhotoIndex(0);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-3 pt-16 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1.5" />
                  <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                      <div className="flex items-center gap-2">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-14 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="relative w-full h-32 md:h-40 bg-gray-200 animate-pulse" />
                <div className="p-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                  </div>
                </div>
                <div className="px-3 pb-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 px-3 pt-16 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <InformationCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 text-sm">
                Error Loading Announcements
              </h3>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 pt-16 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex-shrink-0">
                <MegaphoneIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  Announcements
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Stay updated with the latest news
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm flex-shrink-0">
              <span className="text-base md:text-lg font-bold text-blue-600">
                {announcements.length}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {announcements.length === 1 ? "Post" : "Posts"}
              </span>
            </div>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <MegaphoneIcon className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">
              No Announcements Yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              There are no announcements at this time. Check back later for
              updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <article
                key={announcement?.unique_id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden group"
              >
                <div className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 mb-1">
                        <h2 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors break-words line-clamp-1">
                          {announcement?.title}
                        </h2>
                        {announcement.source === "system" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200 flex-shrink-0 mt-0.5">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(announcement?.created_at)}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <span>{formatTime(announcement?.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                        {getTimeAgo(announcement?.created_at)}
                      </span>
                      {announcement.photos &&
                        announcement.photos.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold rounded-md">
                            <PhotoIcon className="w-3 h-3" />
                            {announcement.photos.length}
                          </span>
                        )}
                    </div>
                  </div>

                  {announcement?.priority && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        announcement.priority === "urgent"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : announcement.priority === "important"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {announcement.priority.toUpperCase()}
                    </span>
                  )}
                </div>

                {announcement?.image_url &&
                  typeof announcement.image_url === "string" &&
                  (announcement.image_url.startsWith("http://") ||
                    announcement.image_url.startsWith("https://") ||
                    announcement.image_url.startsWith("/")) && (
                    <div className="relative w-full h-32 md:h-44 bg-gray-100">
                      <Image
                        src={announcement.image_url}
                        alt={announcement.title}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => openModal(announcement)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        unoptimized={
                          !announcement.image_url.startsWith(
                            process.env.NEXT_PUBLIC_BASE_URL || ""
                          )
                        }
                      />
                      {announcement.photos &&
                        announcement.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded-md backdrop-blur-sm">
                            1 / {announcement.photos.length}
                          </div>
                        )}
                    </div>
                  )}

                <div className="p-3 pt-2">
                  <div
                    className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: announcement?.message || "",
                    }}
                  />
                </div>

                <div className="px-3 pb-3 flex items-center justify-between border-t border-gray-100 pt-2">
                  <button
                    onClick={() => openModal(announcement)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 border border-blue-200 hover:border-blue-600 rounded-lg transition-all duration-200"
                  >
                    <span>Read More</span>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => {
            setSelectedAnnouncement(null);
            setCurrentPhotoIndex(0);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 md:p-4 flex items-center justify-between z-10">
              <div className="flex-1 pr-3 min-w-0">
                <div className="flex items-start gap-1.5 mb-1">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 break-words line-clamp-1">
                    {selectedAnnouncement?.title}
                  </h3>
                  {selectedAnnouncement.source === "system" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200 flex-shrink-0 mt-0.5">
                      SYSTEM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-gray-400" />
                    <span>{formatDate(selectedAnnouncement?.created_at)}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span>{formatTime(selectedAnnouncement?.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAnnouncement(null);
                  setCurrentPhotoIndex(0);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              </button>
            </div>

            {selectedAnnouncement?.photos &&
              selectedAnnouncement.photos.length > 0 &&
              selectedAnnouncement.photos[currentPhotoIndex] &&
              typeof selectedAnnouncement.photos[currentPhotoIndex]
                .photo_url === "string" &&
              (selectedAnnouncement.photos[
                currentPhotoIndex
              ].photo_url.startsWith("http://") ||
                selectedAnnouncement.photos[
                  currentPhotoIndex
                ].photo_url.startsWith("https://") ||
                selectedAnnouncement.photos[
                  currentPhotoIndex
                ].photo_url.startsWith("/")) && (
                <div className="relative w-full h-48 md:h-72 bg-gray-100">
                  <Image
                    src={
                      selectedAnnouncement.photos[currentPhotoIndex].photo_url
                    }
                    alt={`${selectedAnnouncement.title} - Photo ${
                      currentPhotoIndex + 1
                    }`}
                    fill
                    className="object-contain"
                    unoptimized={
                      !selectedAnnouncement.photos[
                        currentPhotoIndex
                      ].photo_url.startsWith(
                        process.env.NEXT_PUBLIC_BASE_URL || ""
                      )
                    }
                  />

                  {selectedAnnouncement.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => prevPhoto(selectedAnnouncement.photos)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                      >
                        <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => nextPhoto(selectedAnnouncement.photos)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                      >
                        <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </button>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                        {currentPhotoIndex + 1} /{" "}
                        {selectedAnnouncement.photos.length}
                      </div>

                      <div className="hidden sm:flex absolute bottom-2 right-2 gap-1.5">
                        {selectedAnnouncement.photos
                          .filter(
                            (photo) =>
                              typeof photo.photo_url === "string" &&
                              (photo.photo_url.startsWith("http://") ||
                                photo.photo_url.startsWith("https://") ||
                                photo.photo_url.startsWith("/"))
                          )
                          .map((photo, idx) => (
                            <button
                              key={photo.photo_id}
                              onClick={() => setCurrentPhotoIndex(idx)}
                              className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${
                                idx === currentPhotoIndex
                                  ? "border-blue-500 ring-1 ring-blue-300"
                                  : "border-white/50 hover:border-white"
                              }`}
                            >
                              <Image
                                src={photo.photo_url}
                                alt={`Thumbnail ${idx + 1}`}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized={
                                  !photo.photo_url.startsWith(
                                    process.env.NEXT_PUBLIC_BASE_URL || ""
                                  )
                                }
                              />
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            <div className="p-3 md:p-4">
              {selectedAnnouncement.updated_at &&
                selectedAnnouncement.updated_at !==
                  selectedAnnouncement.created_at && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">
                      Updated: {formatDate(selectedAnnouncement.updated_at)} at{" "}
                      {formatTime(selectedAnnouncement.updated_at)}
                    </p>
                  </div>
                )}

              <div
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: selectedAnnouncement?.message || "",
                }}
              />
            </div>

            <div className="border-t border-gray-200 p-3 md:p-4">
              <button
                onClick={() => {
                  setSelectedAnnouncement(null);
                  setCurrentPhotoIndex(0);
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
