"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import { useOnboarding } from "@/hooks/useOnboarding";
import { landlordDashboardTourSteps } from "@/lib/onboarding/dashboardTourSteps";
import { landlordDashboardTourStepsMobile } from "@/lib/onboarding/landlordDashboardTourStepsMobile";

import PointsEarnedAlert from "@/components/Commons/alertPoints";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";
import LeaseOccupancyCard from "./LeaseOccupancyCard";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const CardSkeleton = () => (
  <div className="h-[350px] rounded-2xl bg-gray-100 animate-pulse" />
);

const SmallCardSkeleton = () => (
  <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
);

const PaymentSummaryCard = dynamic(
  () => import("../analytics/PaymentSummaryCard"),
  { ssr: false, loading: () => <CardSkeleton /> },
);

const PendingMaintenanceDonut = dynamic(
  () => import("../analytics/PendingMaintenanceDonut"),
  { ssr: false, loading: () => <CardSkeleton /> },
);

const TodayCalendar = dynamic(
  () => import("@/components/landlord/main_dashboard/TodayCalendar"),
  { ssr: false, loading: () => <CardSkeleton /> },
);

const RevenuePerformanceChart = dynamic(
  () => import("../analytics/revenuePerformance"),
  { ssr: false, loading: () => <CardSkeleton /> },
);

const MobileLandlordDashboard = dynamic(
  () => import("@/components/landlord/main_dashboard/mobile_dashboard"),
  { ssr: false, loading: () => null },
);

interface Props {
  landlordId: string;
}

export default function LandlordMainDashboard({ landlordId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const displayName = useMemo(
    () => user?.firstName || user?.companyName || user?.email,
    [user?.firstName, user?.companyName, user?.email],
  );

  const prevPoints = useRef<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (user?.points == null) {
      prevPoints.current = null;
      return;
    }
    if (prevPoints.current !== null && user.points > prevPoints.current && !showAlert) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(timer);
    }
    prevPoints.current = user.points;
  }, [user?.points, showAlert]);

  const { data: verification } = useSWR(
    `/api/landlord/${landlordId}/profileStatus`,
    fetcher,
    { dedupingInterval: 60_000, revalidateOnFocus: false },
  );

  useSWR(`/api/landlord/subscription/active/${landlordId}`, fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });

  const [showRevenueChart, setShowRevenueChart] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowRevenueChart(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const [showNewModal, setShowNewModal] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  useOnboarding({
    tourId: "landlord_dashboard",
    steps: isMobile ? landlordDashboardTourStepsMobile : landlordDashboardTourSteps,
    autoStart: true,
  });

  const emailVerified = user?.emailVerified ?? false;

  return (
    <div className="pb-24 md:pb-6">
      <div className="px-4 md:px-6 pt-4 md:pt-6 space-y-4">
        {showAlert && <PointsEarnedAlert points={user?.points} />}

        <div id="dashboard-header">
          <HeaderContent
            greeting={greeting}
            displayName={displayName}
            landlordId={landlordId}
          />
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block space-y-4">
          {/* Stat Cards Row */}
          <Suspense fallback={
            <div className="grid grid-cols-4 gap-4">
              <SmallCardSkeleton />
              <SmallCardSkeleton />
              <SmallCardSkeleton />
              <SmallCardSkeleton />
            </div>
          }>
            <PaymentSummaryCard landlord_id={landlordId} />
          </Suspense>

          {/* Main Grid: Left (2/3) + Right (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-4">
              {/* Revenue Chart */}
              {showRevenueChart && (
                <Suspense fallback={<CardSkeleton />}>
                  <RevenuePerformanceChart landlord_id={landlordId} />
                </Suspense>
              )}

              {/* Maintenance Status */}
              <Suspense fallback={<CardSkeleton />}>
                <PendingMaintenanceDonut landlordId={landlordId} />
              </Suspense>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1 space-y-4">
              {/* Quick Actions */}
              <div id="dashboard-quick-actions">
                <QuickActions
                  onAddProperty={() =>
                    router.push("/landlord/properties/create-property")
                  }
                  onInviteTenant={() => router.push("/landlord/invite-tenant")}
                  onAnnouncement={() =>
                    router.push("/landlord/announcement/create-announcement")
                  }
                  onWorkOrder={() => setShowNewModal(true)}
                  onIncome={() => router.push("/landlord/payouts")}
                  emailVerified={emailVerified}
                />
              </div>

              {/* Calendar */}
              <Suspense fallback={<CardSkeleton />}>
                <div id="dashboard-maintenance" className="h-full">
                  <TodayCalendar landlordId={landlordId} />
                </div>
              </Suspense>

              {/* Action Required */}
              <Suspense fallback={<CardSkeleton />}>
                <div id="dashboard-occupancy" className="h-full">
                  <LeaseOccupancyCard landlord_id={landlordId} />
                </div>
              </Suspense>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Suspense fallback={null}>
            <MobileLandlordDashboard landlordId={landlordId} />
          </Suspense>
        </div>

        {showNewModal && (
          <NewWorkOrderModal
            landlordId={landlordId}
            onClose={() => setShowNewModal(false)}
            onCreated={() => setShowNewModal(false)}
          />
        )}
      </div>
    </div>
  );
}
