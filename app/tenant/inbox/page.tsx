"use client";

import { useState, useEffect, useCallback } from "react";
import useAuthStore from "../../../../zustand/authStore";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Megaphone,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

// Types
interface Notification {
  id: string;
  title: string;
  body: string;
  type: "urgent" | "success" | "info" | "default";
  is_read: boolean;
  created_at: string;
  timestamp?: string;
}

interface Announcement {
  id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  created_at: string;
  photos?: string[];
  landlord?: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}

// Image Lightbox Component
const ImageLightbox = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      <div
        className="relative max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt="Full size"
          className="w-full max-h-[85vh] rounded-lg object-contain"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Announcement Detail Modal
const AnnouncementModal = ({ announcement, onClose, onImageClick }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {announcement.subject}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {formatDate(announcement.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Landlord Info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <img
              src={
                announcement.landlord?.profilePicture ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png"
              }
              alt="Landlord"
              className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {announcement.landlord
                    ? `${announcement.landlord.firstName} ${announcement.landlord.lastName}`
                    : "Landlord"}
                </span>
              </div>
              {announcement.property_name && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">
                    {announcement.property_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Message
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {announcement.description}
            </p>
          </div>

          {/* Images */}
          {announcement.photos && announcement.photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                Attachments ({announcement.photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {announcement.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => onImageClick(announcement.photos, index)}
                    className="relative overflow-hidden rounded-lg group aspect-square"
                  >
                    <img
                      src={photo}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Page_footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact Notification Item (List View)
const NotificationItemCompact = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}) => {
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "success":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative px-3 sm:px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.is_read ? "bg-blue-50/30" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className={`text-sm text-gray-900 line-clamp-1 ${
                  !notification.is_read ? "font-semibold" : "font-medium"
                }`}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(notification.created_at || notification.timestamp)}
            </span>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {notification.body}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                notification.type
              )}`}
            >
              {notification.type}
            </span>

            {/* Actions - Always visible on mobile, hover on desktop */}
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {!notification.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Announcement Item (List View)
const AnnouncementItemCompact = ({ announcement, onClick }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="group relative px-3 sm:px-4 py-3 border-b border-gray-100 bg-emerald-50/30 hover:bg-emerald-50/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Landlord Avatar */}
        <img
          src={
            announcement.landlord?.profilePicture ||
            "https://cdn-icons-png.flaticon.com/512/847/847969.png"
          }
          alt="Landlord"
          className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Megaphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {announcement.subject}
              </h3>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(announcement.created_at)}
            </span>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {announcement.description}
          </p>

          <div className="flex items-center justify-between">
            {/* Property Name */}
            {announcement.property_name && (
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600">
                  {announcement.property_name}
                </span>
              </div>
            )}

            {/* Image Indicator */}
            {announcement.photos && announcement.photos.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <ImageIcon className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {announcement.photos.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TenantInboxProfessional() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuthStore();

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (!user || !user.user_id) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const notifResponse = await fetch(
          `/api/notification/getNotifications?userId=${user.user_id}`
        );
        if (!notifResponse.ok) throw new Error("Failed to fetch notifications");
        const notifData = await notifResponse.json();
        const sortedNotifications = (
          Array.isArray(notifData) ? notifData : []
        ).sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp).getTime() -
            new Date(a.created_at || a.timestamp).getTime()
        );
        setNotifications(sortedNotifications);

        if (user.tenant_id) {
          const announcementResponse = await fetch(
            `/api/tenant/activeRent/announcement?tenant_id=${user.tenant_id}`
          );
          if (!announcementResponse.ok)
            throw new Error("Failed to fetch announcements");
          const announcementData = await announcementResponse.json();
          setAnnouncements(announcementData.announcements || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch("/api/notification/markSingleRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      const response = await fetch("/api/notification/markAllAsRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: unreadNotifications.map((n) => n.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notification/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setSelectedImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : filter === "read"
      ? notifications.filter((n) => n.is_read)
      : notifications;

  const combinedItems = [...filteredNotifications, ...announcements].sort(
    (a, b) =>
      new Date(b.created_at || (b as any).timestamp).getTime() -
      new Date(a.created_at || (a as any).timestamp).getTime()
  );

  const totalPages = Math.ceil(combinedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = combinedItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {lightboxOpen && (
        <ImageLightbox
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() =>
            setCurrentImageIndex((i) => (i + 1) % selectedImages.length)
          }
          onPrev={() =>
            setCurrentImageIndex(
              (i) => (i - 1 + selectedImages.length) % selectedImages.length
            )
          }
        />
      )}

      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          onImageClick={openLightbox}
        />
      )}

      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Your notifications and announcements
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase mb-1">
              Total
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {notifications.length + announcements.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg border border-blue-200 p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase mb-1">
              Unread
            </p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">
              {unreadCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-700 uppercase mb-1">
              Updates
            </p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600">
              {announcements.length}
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
              {[
                {
                  key: "all",
                  label: "All",
                  count: notifications.length + announcements.length,
                },
                { key: "unread", label: "Unread", count: unreadCount },
                {
                  key: "read",
                  label: "Read",
                  count: notifications.length - unreadCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    filter === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="hidden sm:inline">
                    {tab.label} ({tab.count})
                  </span>
                  <span className="sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600">
                {combinedItems.length} item
                {combinedItems.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Mark All Read</span>
                    <span className="sm:hidden">Mark All</span>
                  </button>
                )}
                <button
                  onClick={() => fetchData(true)}
                  disabled={isLoading}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 border border-gray-200"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inbox List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-20 sm:mb-6">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse p-3 sm:p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Error loading inbox
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchData(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
              >
                Try Again
              </button>
            </div>
          ) : combinedItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-sm text-gray-600">
                No new notifications or announcements
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedItems.map((item: any) =>
                "subject" in item ? (
                  <AnnouncementItemCompact
                    key={`announcement-${item.id}`}
                    announcement={item}
                    onClick={() => setSelectedAnnouncement(item)}
                  />
                ) : (
                  <NotificationItemCompact
                    key={`notification-${item.id}`}
                    notification={item}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={() => {
                      if (!item.is_read) markAsRead(item.id);
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {combinedItems.length > itemsPerPage && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-20 sm:mb-4">
            <div className="flex flex-col gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(endIndex, combinedItems.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {combinedItems.length}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
