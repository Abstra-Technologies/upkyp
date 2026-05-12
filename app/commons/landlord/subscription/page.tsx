"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ScrollText, ShieldCheck, CreditCard, X, ArrowUpRight, Sparkles } from "lucide-react";
import LandlordSubscriptionPlanComponent from "@/components/landlord/subscrription";
import LandlordPastSubscriptionsComponent from "@/components/landlord/widgets/LandlordPastSubscriptionsComponent";
import useAuthStore from "@/zustand/authStore";

export default function LandlordSubscriptionPlan() {
  const { fetchSession, user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upgrade");

  useEffect(() => {
    if (!user) fetchSession();
  }, [user]);

  return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-3 md:px-6 lg:px-8 py-3 lg:py-6">
                <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                        <div className="w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md lg:shadow-lg">
                            <ShieldCheck className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base lg:text-2xl font-bold text-gray-900 truncate">
                                Your Subscription
                            </h1>
                            <p className="text-[11px] lg:text-sm text-gray-500 truncate">
                                Manage plan, policies & billing history
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1 px-2 py-1.5 lg:px-3 lg:py-2 text-[10px] lg:text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg active:bg-gray-200 transition-all"
                        >
                            <ScrollText className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            <span className="hidden sm:inline">Policies</span>
                        </button>
                        <Link
                            href="/public/pricing"
                            className="flex items-center gap-1 px-2.5 py-1.5 lg:px-4 lg:py-2 text-[10px] lg:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg active:shadow-md transition-all"
                        >
                            <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            <span>Upgrade</span>
                            <ArrowUpRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-3 md:px-6 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-8">
                <div className="max-w-5xl mx-auto space-y-3 lg:space-y-4">
                    {/* CURRENT PLAN */}
                    <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-5 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                                <h2 className="text-xs sm:text-base font-semibold text-gray-900 truncate">
                                    Your Current Plan
                                </h2>
                            </div>
                        </div>
                        <div className="p-3 sm:p-4">
                            <LandlordSubscriptionPlanComponent
                                landlord_id={user?.landlord_id}
                            />
                        </div>
                    </div>

                    {/* PAST SUBSCRIPTIONS */}
                    <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-5 py-3 border-b border-gray-100">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                            </div>
                            <h2 className="text-xs sm:text-base font-semibold text-gray-900">Past Subscriptions</h2>
                        </div>
                        <div className="p-3 sm:p-4">
                            <LandlordPastSubscriptionsComponent
                                landlord_id={user?.landlord_id}
                            />
                        </div>
                    </div>
                </div>
            </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ScrollText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Subscription Policies
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 p-1 rounded-lg active:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab Buttons */}
              <div className="flex gap-1 mb-4 p-0.5 bg-gray-100 rounded-lg">
                {[
                  { id: "upgrade", label: "Upgrade" },
                  { id: "trial", label: "Free Trial" },
                  { id: "refund", label: "Refund" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-gray-600 space-y-3 text-xs sm:text-sm leading-relaxed">
                {activeTab === "upgrade" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Upgrade Policy
                      </h3>
                    </div>
                    <p>
                      UpKyp offers a flexible upgrade policy. If you choose to upgrade before your billing cycle ends, the additional cost will be pro-rated based on remaining days, so you only pay for what you use.
                    </p>
                  </div>
                )}

                {activeTab === "trial" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Free Trial Policy
                      </h3>
                    </div>
                    <p>
                      Each landlord is eligible for one free trial. If you've already used a trial, you'll need to subscribe to continue. No payment details are required during your first trial period.
                    </p>
                  </div>
                )}

                {activeTab === "refund" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Refund Policy
                      </h3>
                    </div>
                    <p>
                      UpKyp does not offer refunds after payment has been processed. Please review your selected plan before confirming your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <Link
                href="/pricing"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg active:shadow-md transition-all"
              >
                <Sparkles className="w-3 h-3" />
                View Plans
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg active:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
