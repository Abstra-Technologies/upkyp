"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  RefreshCw,
  Check,
  CheckCheck,
  Trash2,
  X,
  Inbox,
} from "lucide-react";

/* =====================================================
   🔹 Custom Hook: useNotifications
   ===================================================== */
const useNotifications = (user, admin) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef(0);

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      try {
        if (!user && !admin) return;

        const userId = user?.user_id || admin?.admin_id;
        if (!userId) return;

        const now = Date.now();
        if (now - lastFetchRef.current < 5000) return;
        lastFetchRef.current = now;

        if (showLoading) setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );
        if (!res.ok)
          throw new Error(`Failed to fetch notifications (${res.status})`);
        const data = await res.json();

        const sorted = data.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp).getTime() -
            new Date(a.created_at || a.timestamp).getTime()
        );
        setNotifications(sorted);
        setUnreadCount(sorted.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [user, admin]
  );

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(() => fetchNotifications(false), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const res = await fetch("/api/notification/markSingleRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    try {
      await fetch("/api/notification/markAllAsRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread.map((n) => n.id) }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/notification/delete/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === id);
          if (notification && !notification.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

/* =====================================================
   🔹 Format Time Helper
   ===================================================== */
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

/* =====================================================
   🔹 Notification Item
   ===================================================== */
const NotificationItem = ({ notification, onMarkRead, onDelete, index }) => {
  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkRead(notification.id);
    }
    if (notification.url) {
      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const fullUrl = `${base}${
        notification.url.startsWith("/")
          ? notification.url
          : `/${notification.url}`
      }`;
      window.location.href = fullUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`group relative cursor-pointer transition-all duration-200 ${
        !notification.is_read
          ? "bg-gradient-to-r from-blue-50/80 to-emerald-50/80"
          : "hover:bg-gray-50"
      }`}
      onClick={handleClick}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Unread Indicator */}
        <div className="pt-1.5 flex-shrink-0">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              notification.is_read
                ? "bg-gray-300"
                : "bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/30"
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-snug mb-1 ${
              !notification.is_read
                ? "font-semibold text-gray-900"
                : "font-medium text-gray-700"
            }`}
          >
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            {formatTimeAgo(notification.created_at || notification.timestamp)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4 text-blue-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* =====================================================
   🔹 Empty State
   ===================================================== */
const EmptyState = ({ filter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-12 px-4 text-center"
  >
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
      <Inbox className="w-8 h-8 text-blue-500" />
    </div>
    <p className="text-sm font-medium text-gray-700">
      {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
    </p>
    <p className="text-xs text-gray-500 mt-1">
      {filter === "all"
        ? "We'll notify you when something arrives"
        : "Check back later"}
    </p>
  </motion.div>
);

/* =====================================================
   🔹 Loading State
   ===================================================== */
const LoadingState = () => (
  <div className="py-12 px-4 text-center">
    <div className="w-10 h-10 mx-auto mb-4 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-500">Loading notifications...</p>
  </div>
);

/* =====================================================
   🔹 Error State
   ===================================================== */
const ErrorState = ({ error, onRetry }) => (
  <div className="py-12 px-4 text-center">
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
      <X className="w-6 h-6 text-red-600" />
    </div>
    <p className="text-sm font-medium text-red-600 mb-3">{error}</p>
    <button
      onClick={onRetry}
      className="text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      Try again
    </button>
  </div>
);

/* =====================================================
   🔹 Notification Dropdown
   ===================================================== */
const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  onClose,
  user,
  buttonRef,
  isMobile = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [filter, setFilter] = useState("all");

  // Position calculation for desktop
  useEffect(() => {
    if (isMobile || !buttonRef?.current) {
      setIsPositioned(true);
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 380;
    const viewportWidth = window.innerWidth;
    const spacing = 12;

    let leftPosition = buttonRect.right - dropdownWidth;
    if (leftPosition < spacing) {
      leftPosition = spacing;
    }
    if (leftPosition + dropdownWidth > viewportWidth - spacing) {
      leftPosition = viewportWidth - dropdownWidth - spacing;
    }

    setPosition({
      top: buttonRect.bottom + 8,
      left: leftPosition,
    });
    setIsPositioned(true);
  }, [buttonRef, isMobile]);

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read
  );

  const containerClasses = isMobile
    ? "fixed inset-x-0 top-14 bottom-0 bg-white z-[100] flex flex-col"
    : `fixed w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] flex flex-col overflow-hidden transition-opacity duration-150 ${
        isPositioned ? "opacity-100" : "opacity-0"
      }`;

  const containerStyle = isMobile
    ? {}
    : {
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: "min(600px, 80vh)",
      };

  return (
    <motion.div
      ref={dropdownRef}
      initial={{
        opacity: 0,
        y: isMobile ? -10 : 8,
        scale: isMobile ? 1 : 0.96,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isMobile ? -10 : 8, scale: isMobile ? 1 : 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {notifications.length > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "read", label: "Read" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all relative ${
                filter === key
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {filter === key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-600"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <ErrorState error={error} onRetry={() => onRefresh()} />
        ) : loading && notifications.length === 0 ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="divide-y divide-gray-100">
              {filtered.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkAsRead}
                  onDelete={onDelete}
                  index={index}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 p-3 text-center bg-gray-50/50 flex-shrink-0">
          <Link
            href={`/${user?.userType || "tenant"}/inbox`}
            onClick={onClose}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </motion.div>
  );
};

/* =====================================================
   🔹 Main Component: NotificationSection
   ===================================================== */
const NotificationSection = ({ user, admin, variant = "default" }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user, admin);

  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Determine button styling based on variant
  const getButtonClasses = () => {
    const base = "relative p-2 rounded-xl transition-all duration-200 group";
    switch (variant) {
      case "sidebar":
        return `${base} hover:bg-gray-100 text-gray-600`;
      case "light":
        return `${base} hover:bg-gray-100 text-gray-700`;
      default:
        return `${base} hover:bg-white/10 text-white border border-white/20 hover:border-white/40`;
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case "sidebar":
      case "light":
        return "w-5 h-5 group-hover:scale-110 transition-transform";
      default:
        return "w-5 h-5 group-hover:scale-110 transition-transform";
    }
  };

  return (
    <div ref={wrapperRef}>
      {/* Desktop */}
      <div className="hidden md:block">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
          aria-label="Notifications"
        >
          <Bell className={getIconClasses()} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isOpen && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              error={error}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onRefresh={() => fetchNotifications(true)}
              onClose={() => setIsOpen(false)}
              user={user}
              buttonRef={buttonRef}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
          aria-label="Notifications"
        >
          <Bell className={getIconClasses()} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]"
                onClick={() => setIsOpen(false)}
              />
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                loading={loading}
                error={error}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onRefresh={() => fetchNotifications(true)}
                onClose={() => setIsOpen(false)}
                user={user}
                buttonRef={buttonRef}
                isMobile
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationSection;
