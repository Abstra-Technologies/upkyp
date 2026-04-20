"use client";

import { useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import LeaseInfoWidget from "@/components/tenant/analytics-insights/LeaseInfoWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MobilePortalDashboard from "@/components/tenant/currentRent/MobilePortalDashboard";
import axios from "axios";
import {
  HomeIcon,
  MegaphoneIcon,
  ClockIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import PortalAccessGate from "@/components/tenant/currentRent/PortalAccessGate/PortalAccessGate";
import { useRouter } from "next/navigation";

export default function RentPortalPage() {
  const { user, fetchSession } = useAuthStore();
  const params = useParams();
  const agreementId = params?.agreement_id as string | undefined;
  const router = useRouter();

  const [unitInfo, setUnitInfo] = useState<{
    unit_name: string;
    property_name: string;
  } | null>(null);
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
        await axios.get(`/api/tenant/validate-agreement/${agreementId}`);
        setAuthorized(true);
      } catch {
        window.location.href = "/tenant/not-authorized";
      } finally {
        setAuthChecked(true);
      }
    }

    validateAgreement();
  }, [authReady, agreementId]);

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

  if (isInitialLoad || !agreementId) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 md:p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-36 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-only compact dashboard */}
      <div className="block md:hidden">
        <MobilePortalDashboard />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block min-h-screen bg-gray-50 p-3 md:p-4">
        <PortalAccessGate agreementId={agreementId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-amber-500" />
              Pending Payments
            </h2>
            <PaymentDueWidget agreement_id={agreementId} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentCheckIcon className="w-4 h-4 text-blue-500" />
              Lease Info
            </h2>
            <LeaseInfoWidget agreement_id={agreementId} />
          </div>
        </div>

        {/* Announcements */}
        <section className="mt-4">
          <div className="flex items-center gap-2.5 md:gap-3 mb-3">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-sm">
              <MegaphoneIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-gray-900">
                Property Announcements
              </h2>
              <p className="text-xs text-gray-600">
                Latest announcements and notices
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
            <AnnouncementWidget agreement_id={agreementId} />
          </div>
        </section>
      </div>
    </>
  );
}
