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
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Your Subscription
              </h1>
              <p className="text-sm text-gray-500">
                Manage your plan, review policies, and view billing history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all"
            >
              <ScrollText className="w-3.5 h-3.5" />
              Policies
            </button>
            <Link
              href="/public/pricing"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:shadow-md hover:shadow-blue-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upgrade Plan</span>
              <span className="sm:hidden">Upgrade</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Gradient Card Container */}
          <div className="bg-gradient-to-br from-blue-50/60 via-white to-emerald-50/60 rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* CURRENT PLAN */}
            <section className="border-b border-gray-200/80 last:border-b-0">
              <header className="flex items-center justify-between gap-3 px-4 sm:px-5 lg:px-6 py-3.5 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                      Your Current Plan
                    </h2>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Active subscription details
                    </p>
                  </div>
                </div>

                {/* Mobile Policies Button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  Policies
                </button>
              </header>

              <div className="p-3 sm:p-4 lg:p-5">
                <LandlordSubscriptionPlanComponent
                  landlord_id={user?.landlord_id}
                />
              </div>
            </section>

            {/* PAST SUBSCRIPTIONS */}
            <section>
              <header className="flex items-center gap-2 px-4 sm:px-5 lg:px-6 py-3.5 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                    Past Subscriptions
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Billing history and previous plans
                  </p>
                </div>
              </header>

              <div className="p-3 sm:p-4 lg:p-5">
                <LandlordPastSubscriptionsComponent
                  landlord_id={user?.landlord_id}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ScrollText className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  Subscription Policies
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* Tab Buttons */}
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                {[
                  { id: "upgrade", label: "Upgrade" },
                  { id: "trial", label: "Free Trial" },
                  { id: "refund", label: "Refund" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
                {activeTab === "upgrade" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Upgrade Policy
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      UpKyp offers a flexible upgrade policy for subscription
                      plans. If you choose to upgrade before your billing cycle
                      ends, the additional cost will be pro-rated based on
                      remaining days, so you only pay for what you use.
                    </p>
                  </div>
                )}

                {activeTab === "trial" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Free Trial Policy
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      Each landlord is eligible for one free trial. If you've
                      already used a trial, you'll need to subscribe to
                      continue. No payment details are required during your
                      first trial period.
                    </p>
                  </div>
                )}

                {activeTab === "refund" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Refund Policy
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      UpKyp does not offer refunds after payment has been
                      processed. Please review your selected plan before
                      confirming your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                View Plans
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
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
