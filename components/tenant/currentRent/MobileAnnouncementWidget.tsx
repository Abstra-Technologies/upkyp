"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ClockIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface Announcement {
  announcement_id: number;
  subject: string;
  description: string;
  created_at: string;
  photo_urls: string[];
}

export default function MobileAnnouncementWidget({
  agreement_id,
}: {
  agreement_id: string | number;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!agreement_id) return;
    let active = true;

    async function fetchAnnouncements() {
      try {
        const response = await axios.get<{ announcements: Announcement[] }>(
          `/api/tenant/announcement/getAnnouncementPerProperty?agreement_id=${agreement_id}`
        );
        if (active) {
          const sanitized = response.data.announcements.map((ann) => ({
            ...ann,
            photo_urls: Array.isArray(ann.photo_urls) ? ann.photo_urls : [],
          }));
          setAnnouncements(sanitized);
        }
      } catch (err: any) {
        if (active) setError(err.response?.data?.message || "Failed to fetch announcements.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAnnouncements();
    return () => { active = false; };
  }, [agreement_id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="w-1 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2.5 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
          <PhotoIcon className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {announcements.slice(0, 3).map((ann, index) => {
        const isExpanded = expandedId === ann.announcement_id;
        const validPhotos = ann.photo_urls.filter(isValidUrl);

        return (
          <div key={ann.announcement_id} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full ${
                index === 0 ? "bg-blue-500 ring-2 ring-blue-100" : "bg-gray-300"
              }`} />
              {index < 2 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            <div className="flex-1 pb-2">
              <button
                onClick={() => setExpandedId(isExpanded ? null : ann.announcement_id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                      {ann.subject}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <ClockIcon className="w-3 h-3" />
                      <span>{formatDate(ann.created_at)}</span>
                      {index === 0 && (
                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-semibold">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                      {ann.description}
                    </p>

                    {validPhotos.length > 0 && (
                      <div className="mt-2 relative w-full h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={validPhotos[0]}
                          alt={ann.subject}
                          fill
                          className="object-cover"
                        />
                        {validPhotos.length > 1 && (
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded">
                            +{validPhotos.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}

      {announcements.length > 3 && (
        <div className="flex justify-center pt-1">
          <a
            href={`/tenant/rentalPortal/${agreement_id}/announcement`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all {announcements.length} announcements →
          </a>
        </div>
      )}
    </div>
  );
}
