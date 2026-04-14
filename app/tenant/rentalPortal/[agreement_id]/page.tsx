"use client";

import { useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import LeaseDurationTracker from "@/components/tenant/analytics-insights/LeaseAgreementWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import PendingDocumentsWidget from "@/components/tenant/analytics-insights/PendingDocumentsWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";
import axios from "axios";
import {
  HomeIcon,
  ChartBarIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import QuickActionButtons from "@/components/tenant/currentRent/QuickActionButtons";
import PortalAccessGate from "@/components/tenant/currentRent/PortalAccessGate/PortalAccessGate";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function RentPortalPage() {
  const { user, fetchSession } = useAuthStore();
    const params = useParams();
    const agreementId = params?.agreement_id as string | undefined;

  const [unitInfo, setUnitInfo] = useState<{
    unit_name: string;
    property_name: string;
  } | null>(null);
    const router = useRouter();

  const [showMoveInChecklist, setShowMoveInChecklist] = useState(false);
  const [loadingUnitInfo, setLoadingUnitInfo] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [authorized, setAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            if (!user) {
                await fetchSession();
            }
            setAuthReady(true);
            setIsInitialLoad(false);
        }

        checkAuth();
    }, [user, fetchSession]);

    useEffect(() => {
        if (!authReady || !agreementId) return;


        async function validateAgreement() {
            try {
                await axios.get(
                    `/api/tenant/validate-agreement/${agreementId}`
                );
                setAuthorized(true);
            } catch {
                window.location.href = "/pages/tenant/not-authorized";
            } finally {
                setAuthChecked(true);
            }
        }

        validateAgreement();
    }, [authReady, agreementId]);

  // Fetch Unit Info
  useEffect(() => {
    if (!agreementId) return;

    let mounted = true;
    async function fetchData() {
      setLoadingUnitInfo(true);
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`
        );
        if (mounted) setUnitInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch unit info:", err);
      } finally {
        if (mounted) setLoadingUnitInfo(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  // Fetch Checklist
  useEffect(() => {
    if (!agreementId) return;

    let mounted = true;
    async function fetchChecklist() {
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/moveInChecklistStatus?agreement_id=${agreementId}`
        );
        if (mounted) {
          setShowMoveInChecklist(res.data.showButton || false);
        }
      } catch (err) {
        console.error("Failed to fetch move-in checklist:", err);
      }
    }

    fetchChecklist();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  // Show skeleton during initial load
  if (isInitialLoad || !agreementId) {
    return (
      <div className="min-h-screen bg-gray-50 mt-2">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 py-4 md:py-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>

          {/* Widgets Skeleton */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 md:p-5"
                >
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Skeleton */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4" />
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-2">
        <PortalAccessGate agreementId={agreementId} />

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 py-4 md:py-6">
                <div className="flex items-center justify-between gap-4">

                    {/* LEFT: Property / Unit */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl
                        bg-gradient-to-br from-blue-500 to-emerald-500
                        flex items-center justify-center shadow-lg">
                            <HomeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>

                        <div>
                            {loadingUnitInfo ? (
                                <div className="animate-pulse">
                                    <div className="h-5 md:h-6 bg-gray-200 rounded w-36 md:w-48 mb-2" />
                                    <div className="h-3 md:h-4 bg-gray-200 rounded w-24 md:w-32" />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                                        {unitInfo?.property_name || "Property Portal"}
                                    </h1>
                                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {unitInfo?.unit_name
                                            ? unitInfo.unit_name.toLowerCase().startsWith("unit")
                                                ? unitInfo.unit_name
                                                : `Unit ${unitInfo.unit_name}`
                                            : "Tenant Portal"}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: User + Action */}
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="hidden lg:block text-right">
                                <p className="text-sm text-gray-600">Welcome back,</p>
                                <p className="text-base font-semibold text-gray-900">
                                    {user.firstName} {user.lastName}
                                </p>
                            </div>
                        )}

                        {/* HOUSE RULES BUTTON */}
                        <button
                            onClick={() =>
                                router.push(
                                    // "/pages/tenant/house-rules-policy"
                                     `/pages/tenant/rentalPortal/${agreementId}/house-policy`
                                )
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gradient-to-r from-rose-500 to-red-600
                     text-white text-sm font-semibold shadow
                     hover:from-rose-600 hover:to-red-700
                     transition"
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            House Rules & Policy
                        </button>
                    </div>

                </div>
            </div>
        </div>
      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 pb-24 md:pb-8">
        {showMoveInChecklist && <MoveInChecklist agreement_id={agreementId} />}

        <QuickActionButtons agreement_id={agreementId} />

        {/* Tenancy Overview */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-4 md:p-5">
                <PaymentDueWidget agreement_id={agreementId} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-4 md:p-5">
                <LeaseDurationTracker agreement_id={agreementId} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-4 md:p-5">
                <PendingDocumentsWidget agreement_id={agreementId} />
              </div>
            </div>
          </div>
        </section>

        {/* Property Updates */}
        <section>
          <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-sm">
              <MegaphoneIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900">
                Property Announcements
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                Latest announcements and notices
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 md:p-5 lg:p-6">
              <AnnouncementWidget agreement_id={agreementId} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
