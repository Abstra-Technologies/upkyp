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

            {/* ================= PAYMENT (HERO CARD) ================= */}
            <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <MobilePaymentWidget agreement_id={agreementId} />
            </section>

            {/* ================= ANNOUNCEMENTS ================= */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                    <MegaphoneIcon className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-gray-900">
                        Announcements
                    </h2>
                </div>

                <div className="divide-y divide-gray-100">
                    <div className="[&>*]:px-4 [&>*]:py-3 [&>*]:hover:bg-gray-50 [&>*]:transition [&>*]:cursor-pointer">
                        <MobileAnnouncementWidget agreement_id={agreementId} />
                    </div>
                </div>
            </section>

            {/* ================= UTILITY ================= */}
            <section className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <BoltIcon className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-semibold text-gray-900">
                            Utility Costs
                        </h2>
                    </div>

                    <button className="text-xs text-blue-600 font-medium">
                        Details
                    </button>
                </div>

                <MobileUtilityWidget agreement_id={agreementId} />
            </section>

            {/* ================= LEASE ================= */}
            <section className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-semibold text-gray-900">
                            Lease Details
                        </h2>
                    </div>

                    <button className="text-xs text-blue-600 font-medium">
                        View PDF
                    </button>
                </div>

                <MobileLeaseInfo agreement_id={agreementId} />
            </section>
        </div>
    );
}
