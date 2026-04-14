"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import MobileFeedsPage from "@/components/tenant/feeds/MobileFeedsPage";
import DesktopFeedsPage from "@/components/tenant/feeds/DesktopFeedsPage";

export default function TenantFeedsPage() {
  const { user, fetchSession } = useAuthStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      if (!user) {
        await fetchSession();
      }
      setIsInitialLoad(false);
    }
    loadAuth();
  }, [user, fetchSession]);

  if (isInitialLoad) {
    return (
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
              <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileFeedsPage user={user} />
      <DesktopFeedsPage user={user} />
    </>
  );
}
