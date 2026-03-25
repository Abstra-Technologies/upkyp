"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logEvent } from "../../../utils/gtag";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import ChangePasswordModal from "../setttings/changePassword";
import TwoFactorToggle from "../setttings/TwoFactorToggle";
import {
  Shield,
  Lock,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Info,
  Bell,
  BellOff,
} from "lucide-react";

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function SecurityPage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();
  const [pushLoading, setPushLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const setupWebPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      Swal.fire({
        icon: "error",
        title: "Not Supported",
        text: "Push notifications are not supported in this browser.",
      });
      return;
    }

    setPushLoading(true);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        Swal.fire({
          icon: "warning",
          title: "Permission Denied",
          text: "Please enable notifications in your browser settings.",
        });
        setPushLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        Swal.fire({
          icon: "error",
          title: "Configuration Error",
          text: "VAPID key not configured.",
        });
        setPushLoading(false);
        return;
      }

      const appServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        localStorage.setItem("push_endpoint", subscription.endpoint);
        setPushEnabled(true);
        Swal.fire({
          icon: "success",
          title: "Enabled!",
          text: "Push notifications have been enabled.",
          timer: 2000,
        });
      } else {
        throw new Error("Failed to save subscription");
      }
    } catch (err) {
      console.error("Web Push setup failed:", err);
      Swal.fire({
        icon: "error",
        title: "Setup Failed",
        text: "Unable to enable push notifications. Please try again.",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const checkPushStatus = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  };

  useEffect(() => {
    checkPushStatus();
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 lg:h-7 bg-gray-200 rounded-lg w-48 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded-lg w-64 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-4 md:px-6 lg:px-8 py-6">
          {/* Info Alert Skeleton */}
          <div className="bg-gray-100 rounded-2xl p-4 lg:p-5 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NO USER STATE
  // ============================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            User not found. Please log in.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6"
      >
        <div className="flex items-center gap-3 lg:gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25"
          >
            <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Security & Privacy
            </h1>
            <p className="text-sm text-gray-500">
              Manage your account security settings
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
      >
        {/* Info Alert - Full Width */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 lg:p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Keep Your Account Secure
              </p>
              <p className="text-xs lg:text-sm text-blue-700">
                Use a strong password and enable two-factor authentication for
                maximum protection. We recommend updating your password every
                3-6 months.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards Grid - 2 columns on xl screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Password Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-900">
                    Password
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    Update your password regularly for better security
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 lg:p-6">
              <ChangePasswordModal userId={user?.user_id} />
            </div>
          </motion.div>

          {/* Push Notifications Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                  {pushEnabled ? (
                    <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-violet-600" />
                  ) : (
                    <BellOff className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-900">
                    Push Notifications
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    Receive real-time alerts for important updates
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 lg:p-6">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Enable push notifications to receive instant alerts about:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• New messages and inquiries</li>
                  <li>• Lease agreement updates</li>
                  <li>• Payment notifications</li>
                  <li>• Maintenance requests</li>
                </ul>
                <button
                  onClick={setupWebPush}
                  disabled={pushLoading || pushEnabled || !user}
                  className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    pushEnabled
                      ? "bg-green-100 text-green-700 cursor-default"
                      : pushLoading || !user
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
                  }`}
                >
                  {pushLoading
                    ? "Enabling..."
                    : pushEnabled
                    ? "Notifications Enabled"
                    : !user
                    ? "Loading..."
                    : "Enable Push Notifications"}
                </button>
                {!pushEnabled && (
                  <p className="text-[10px] text-gray-400 text-center">
                    If blocked by browser, click the icon in your address bar to allow
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Two-Factor Authentication Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-900">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 lg:p-6">
              <TwoFactorToggle user_id={user?.user_id} />
            </div>
          </motion.div>

          {/* Security Tips Card - Spans full width on xl */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden xl:col-span-2"
          >
            {/* Card Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-900">
                    Security Tips
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    Best practices to keep your account safe
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                {[
                  {
                    color: "bg-blue-500",
                    text: "Use a strong, unique password with at least 12 characters",
                  },
                  {
                    color: "bg-emerald-500",
                    text: "Enable two-factor authentication for added protection",
                  },
                  {
                    color: "bg-purple-500",
                    text: "Never share your password or authentication codes",
                  },
                  {
                    color: "bg-amber-500",
                    text: "Update your password every 3-6 months",
                  },
                  {
                    color: "bg-rose-500",
                    text: "Be cautious of phishing emails and suspicious links",
                  },
                  {
                    color: "bg-cyan-500",
                    text: "Log out from shared or public devices after use",
                  },
                ].map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <span
                      className={`w-2 h-2 ${tip.color} rounded-full mt-1.5 flex-shrink-0`}
                    />
                    <span className="text-sm text-gray-600">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
