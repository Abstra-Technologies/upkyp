"use client";

import { Download, Zap } from "lucide-react";
import Swal from "sweetalert2";

export default function BillingActions({
  propertyDetails,
  configMissing,
  setIsModalOpen,
  handleDownloadSummary,
  hideSetRates,
}: any) {
  return (
    <div
      id="action-buttons-section"
      className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4"
    >
      {!hideSetRates &&
        (propertyDetails?.water_billing_type === "submetered" ||
          propertyDetails?.electricity_billing_type === "submetered") && (
          <button
            disabled={configMissing}
            onClick={() => !configMissing && setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm ${
              configMissing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            Set Rates
          </button>
        )}

      <button
        disabled={configMissing}
        onClick={() =>
          configMissing
            ? Swal.fire(
                "Configuration Required",
                "Please complete property configuration first.",
                "warning",
              )
            : handleDownloadSummary()
        }
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm ${
          configMissing
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
        }`}
      >
        <Download className="w-4 h-4" />
        Summary
      </button>
    </div>
  );
}
