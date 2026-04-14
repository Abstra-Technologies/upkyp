"use client";

import React from "react";
import { useParams } from "next/navigation";
import PDCManagementPerProperty from "@/components/landlord/pdc/PDCManagementPerProperty";
import { FileText, Upload } from "lucide-react";
import UploadPDCModal from "@/components/landlord/pdc/UploadPDCModalPerProperty";
import { useState } from "react";


import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";
import {subscriptionConfig} from "@/constant/subscription/limits";


export default function PDCPerPropertyPage() {
  const { id } = useParams();
  const propertyId = id as string;
  const [openUpload, setOpenUpload] = useState(false);

    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const { subscription, loadingSubscription } =
        useSubscription(landlordId);

    const planName = subscription?.plan_name as keyof typeof subscriptionConfig;

    const canUsePDC =
        planName &&
        subscriptionConfig[planName]?.features?.pdcManagement === true;

    if (!loadingSubscription && !canUsePDC) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full text-center">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Upgrade Required
                    </h2>

                    <p className="text-gray-600 text-sm mb-6">
                        Post-Dated Check (PDC) management is not available on your current
                        plan. Upgrade to manage and track tenant checks.
                    </p>

                    <button
                        onClick={() =>
                            window.location.href = "/pages/landlord/subsciption_plan/pricing"
                        }
                        className="w-full px-5 py-2.5 rounded-xl font-semibold text-white
          bg-gradient-to-r from-blue-600 to-emerald-600
          hover:from-blue-700 hover:to-emerald-700 transition-all"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Post-Dated Checks Management
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Review and manage all PDCs under this property
                </p>
              </div>
            </div>

              <button
                  onClick={() => {
                      if (!canUsePDC) {
                          Swal.fire({
                              icon: "warning",
                              title: "Upgrade Required",
                              text: "PDC management is not available on your current plan.",
                              confirmButtonColor: "#3b82f6",
                          });
                          return;
                      }
                      setOpenUpload(true);
                  }}
                  disabled={!canUsePDC}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5
    rounded-lg font-semibold text-sm transition-all shadow-sm
    ${
                      canUsePDC
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                  <Upload className="w-4 h-4" />
                  Upload PDCs
              </button>

          </div>
        </div>

        {/* Main Content */}
        <PDCManagementPerProperty propertyId={propertyId} />

        {/* Modal */}
        <UploadPDCModal
          isOpen={openUpload}
          onClose={() => setOpenUpload(false)}
          propertyId={propertyId}
          onSuccess={() => {
            // The component will auto-refresh via useEffect
            setOpenUpload(false);
          }}
        />
      </div>
    </div>
  );
}
