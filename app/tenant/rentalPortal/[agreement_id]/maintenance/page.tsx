"use client";

import { Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import MaintenanceRequestList from "@/components/tenant/currentRent/currentMaintainance/maintenance";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function TenantMaintenanceContent() {
  const { user } = useAuthStore();
  const params = useParams();
  const agreementId = params?.agreement_id;

  return (
    <MaintenanceRequestList
      agreement_id={agreementId}
      user_id={user?.user_id}
    />
  );
}

function MaintenanceFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-7 bg-gray-200 rounded w-56 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="h-11 w-full sm:w-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-11 w-full sm:w-40 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>

        {/* Filter Skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-11 w-28 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-64 h-48 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j}>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TenantMaintenance() {
  return (
    <Suspense fallback={<MaintenanceFallback />}>
      <TenantMaintenanceContent />
    </Suspense>
  );
}
