"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";
import LandlordBetaBanner from "@/components/beta-release/LandlordBetaBanner";
import { Home, AlertTriangle } from "lucide-react";
import { GRADIENT_PRIMARY, GRADIENT_TEXT } from "@/constant/design-constants";

export default function LandlordDashboard() {
  const { user, loading, fetchSession } = useAuthStore();

  const landlordId = user?.landlord_id as string | undefined;

  useEffect(() => {
    if (!user) {
      fetchSession();
    }
  }, [user, fetchSession]);

  /* ================= LOADING STATE ================= */
  if (!user && !landlordId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md px-4">
          {/* Animated Spinner */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div
              className={`absolute inset-0 rounded-full border-[6px] border-transparent 
                            bg-gradient-to-r ${GRADIENT_PRIMARY} opacity-20`}
            />
            <div
              className={`absolute inset-0 rounded-full border-[6px] border-transparent 
                            border-t-blue-600 animate-spin`}
            />
          </div>

          {/* Loading Text */}
          <h2 className={`text-2xl font-bold mb-3 ${GRADIENT_TEXT}`}>
            Loading Dashboard
          </h2>
          <p className="text-base text-gray-600 mb-2">
            Setting up your workspace...
          </p>
          <p className="text-sm text-gray-500">This will only take a moment</p>

          {/* Loading Progress Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ================= ERROR STATE - NO LANDLORD ID ================= */
  if (!landlordId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 px-4">
        <div className="text-center max-w-lg bg-white rounded-2xl shadow-xl border border-orange-200 p-8 md:p-10">
          {/* Warning Icon */}
          <div
            className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 
                        rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
          >
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Profile Setup Required
          </h2>

          {/* Description */}
          <p className="text-base text-gray-600 leading-relaxed mb-6">
            We couldn't load your dashboard because your landlord profile needs
            to be completed. This is required to access the platform and manage
            your properties.
          </p>

          {/* Action Button */}
          <a
            href="/pages/landlord/verification"
            className={`inline-flex items-center gap-3 
                            ${GRADIENT_PRIMARY} text-white
                            px-8 py-4 rounded-xl
                            font-bold text-base
                            shadow-lg hover:shadow-xl
                            transition-all duration-300
                            hover:scale-105 active:scale-95`}
          >
            <Home className="w-5 h-5" />
            Complete Profile Setup
          </a>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN DASHBOARD ================= */
  return (
    <div className="min-h-screen bg-gray-50">
      <LandlordBetaBanner />
      <LandlordMainDashboard landlordId={landlordId} />
    </div>
  );
}
