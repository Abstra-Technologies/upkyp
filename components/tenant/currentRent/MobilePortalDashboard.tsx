"use client";

import { useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import MobilePaymentWidget from "@/components/tenant/currentRent/MobilePaymentWidget";
import MobileAnnouncementWidget from "@/components/tenant/currentRent/MobileAnnouncementWidget";
import MobileLeaseInfo from "@/components/tenant/currentRent/MobileLeaseInfo";
import MobileUtilityWidget from "@/components/tenant/currentRent/MobileUtilityWidget";
import axios from "axios";
import {
  HomeIcon,
  MegaphoneIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import PortalAccessGate from "@/components/tenant/currentRent/PortalAccessGate/PortalAccessGate";

export default function MobilePortalDashboard() {
  const { user, fetchSession } = useAuthStore();
  const params = useParams();
  const agreementId = params?.agreement_id as string | undefined;

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (!user) await fetchSession();
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

  if (isInitialLoad || !agreementId) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-28 mb-1.5" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PortalAccessGate agreementId={agreementId} />

      {/* Payment Widget */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded-md">
            <CreditCardIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-xs font-bold text-gray-900">Payments</h2>
        </div>
        <div className="p-3">
          <MobilePaymentWidget agreement_id={agreementId} />
        </div>
      </section>

      {/* Lease Info */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded-md">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-xs font-bold text-gray-900">Lease Info</h2>
        </div>
        <div className="p-3">
          <MobileLeaseInfo agreement_id={agreementId} />
        </div>
      </section>

      {/* Announcements + Utility side by side */}
      <div className="grid grid-cols-1 gap-3">
        {/* Announcements */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1 bg-emerald-100 rounded-md">
              <MegaphoneIcon className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-xs font-bold text-gray-900">Announcements</h2>
          </div>
          <div className="p-3">
            <MobileAnnouncementWidget agreement_id={agreementId} />
          </div>
        </section>

        {/* Utility Consumption - only shows if submetered */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1 bg-amber-100 rounded-md">
              <BoltIcon className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h2 className="text-xs font-bold text-gray-900">Utility Consumption</h2>
          </div>
          <div className="p-3">
            <MobileUtilityWidget agreement_id={agreementId} />
          </div>
        </section>
      </div>
    </div>
  );
}
