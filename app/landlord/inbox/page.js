"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../../../../zustand/authStore";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Wrench,
  UserCheck,
  UserPlus,
  Home,
  FileCheck,
  XCircle,
  Key,
  CheckCircle2,
  Filter,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete, index }) => {
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

  const getNotificationConfig = (title, type) => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("maintenance")) {
      return {
        icon: <Wrench className="w-5 h-5" />,
        color: "red",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        border: "border-l-red-500",
      };
    }
    if (titleLower.includes("application")) {
      return {
        icon: <UserPlus className="w-5 h-5" />,
        color: "blue",
        bg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        border: "border-l-blue-500",
      };
    }
    if (titleLower.includes("proceed")) {
      return {
        icon: <UserCheck className="w-5 h-5" />,
        color: "emerald",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        border: "border-l-emerald-500",
      };
    }
    if (
      titleLower.includes("invite accepted") ||
      titleLower.includes("lease")
    ) {
      return {
        icon: <Key className="w-5 h-5" />,
        color: "emerald",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        border: "border-l-emerald-500",
      };
    }
    if (titleLower.includes("verified")) {
      return {
        icon: <FileCheck className="w-5 h-5" />,
        color: "emerald",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        border: "border-l-emerald-500",
      };
    }
    if (titleLower.includes("rejected")) {
      return {
        icon: <XCircle className="w-5 h-5" />,
        color: "red",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        border: "border-l-red-500",
      };
    }
    if (titleLower.includes("property")) {
      return {
        icon: <Home className="w-5 h-5" />,
        color: "blue",
        bg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        border: "border-l-blue-500",
      };
    }
    if (type === "urgent") {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        color: "red",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        border: "border-l-red-500",
      };
    }
    if (type === "success") {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        color: "emerald",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        border: "border-l-emerald-500",
      };
    }

    return {
      icon: <Bell className="w-5 h-5" />,
      color: "gray",
      bg: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      border: "border-l-gray-300",
    };
  };

  const config = getNotificationConfig(notification.title, notification.type);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative border-l-4 ${config.border} ${
        notification.is_read ? "bg-white" : config.bg
      } hover:bg-gray-50 transition-all duration-200 p-4 rounded-r-xl`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} ${config.iconColor} flex items-center justify-center`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className={`text-sm text-gray-900 line-clamp-2 ${
                  !notification.is_read ? "font-semibold" : "font-medium"
                }`}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              )}
            </div>

            {/* Time */}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTimeAgo(notification.created_at || notification.timestamp)}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {notification.body}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {!notification.is_read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark read
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton Loader
const NotificationSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse p-4 bg-white rounded-xl border border-gray-100"
      >
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function LandlordNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { user } = useAuthStore();

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (!user || !user.user_id) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const userId = encodeURIComponent(user.user_id);
        const response = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        const notificationsArray = Array.isArray(data) ? data : [];

        const sortedNotifications = notificationsArray.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp) -
            new Date(a.created_at || a.timestamp)
        );

        setNotifications(sortedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = notifications.filter((n) => !n.is_read);
    } else if (filter === "read") {
      filtered = notifications.filter((n) => n.is_read);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, filter]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-gray-600 text-sm">
                Stay updated with your property activities
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isLoading}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {notifications.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-4 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              Unread
            </p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              Read
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {notifications.length - unreadCount}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: "all", label: "All", count: notifications.length },
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
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                filter === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-4">
              <NotificationSkeleton />
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error loading notifications
              </h3>
              <p className="text-sm text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => fetchNotifications(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === "unread"
                  ? "All caught up!"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-sm text-gray-600">
                {filter === "all" &&
                  "You'll see notifications here when you receive them"}
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="divide-y divide-gray-100"
            >
              <AnimatePresence>
                {paginatedNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(endIndex, filteredNotifications.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredNotifications.length}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
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
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                            : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
