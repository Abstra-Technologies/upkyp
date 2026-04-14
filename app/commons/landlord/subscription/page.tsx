"use client";
import { useState, useEffect } from "react";
import { ScrollText, ShieldCheck, CreditCard, X } from "lucide-react";
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
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Subscription
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your plan, review policies, and view your billing
                  history.
                </p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Policies
              </button>
            </div>
          </div>

          {/* CURRENT PLAN CARD */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Your Current Plan
              </h2>
            </header>

            <div className="p-4 sm:p-6">
              <LandlordSubscriptionPlanComponent
                landlord_id={user?.landlord_id}
              />
            </div>
          </section>

          {/* PAST SUBSCRIPTIONS */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Past Subscriptions
              </h2>
            </header>
            <div className="p-4 sm:p-6">
              <LandlordPastSubscriptionsComponent
                landlord_id={user?.landlord_id}
              />
            </div>
          </section>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Subscription Policies
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab Buttons */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: "upgrade", label: "Upgrade Policy" },
                  { id: "trial", label: "Free Trial" },
                  { id: "refund", label: "Refund Policy" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
                {activeTab === "upgrade" && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Upgrade Policy
                    </h3>
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
                    <h3 className="text-base font-semibold text-gray-900">
                      Free Trial Policy
                    </h3>
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
                    <h3 className="text-base font-semibold text-gray-900">
                      Refund Policy
                    </h3>
                    <p className="text-gray-600">
                      UpKyp does not offer refunds after payment has been
                      processed. Please review your selected plan before
                      confirming your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Page_footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
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
