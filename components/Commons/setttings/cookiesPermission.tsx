"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X, Shield, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CookiesPermission() {
  const [visible, setVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay so it doesn't compete with other prompts
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Desktop Version - Bottom Center (between InstallPrompt on left and FeedbackWidget on right) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-lg">
              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      Cookie Settings
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      We use cookies to enhance your experience and analyze
                      traffic.{" "}
                      <Link
                        href="/public/cookiePolicy"
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                      >
                        Learn more
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={declineCookies}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={acceptCookies}
                    className="flex-1 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Accept All Cookies
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Version - Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[80]"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20"
              onClick={declineCookies}
            />

            <div className="relative bg-white rounded-t-3xl shadow-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-5 pb-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Cookie Settings
                    </h3>
                    <p className="text-xs text-gray-500">
                      Manage your preferences
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  We use cookies to enhance your experience and analyze our
                  traffic.{" "}
                  <Link
                    href="/public/cookiePolicy"
                    className="text-blue-600 font-medium"
                  >
                    Learn more
                  </Link>
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={declineCookies}
                    className="flex-1 px-4 py-3.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={acceptCookies}
                    className="flex-1 px-4 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
