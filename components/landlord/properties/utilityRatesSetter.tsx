"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Info,
  X,
  Zap,
  Droplet,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";

interface PropertyRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData: any;
  billingForm: any;
  propertyDetails: any;
  hasBillingForMonth: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveorUpdateRates: (e: React.FormEvent) => void;
  onBillingUpdated?: (updatedData: any) => void;
}

const toDateInputValue = (dateValue: any): string => {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function PropertyRatesModal({
  isOpen,
  onClose,
  billingData,
  billingForm,
  propertyDetails,
  hasBillingForMonth,
  handleInputChange,
  handleSaveorUpdateRates,
  onBillingUpdated,
}: PropertyRatesModalProps) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!isOpen || !billingData) return;

    if (!billingForm.periodStart && billingData.period_start) {
      handleInputChange({
        target: { name: "periodStart", value: toDateInputValue(billingData.period_start) },
      } as any);
    }
    if (!billingForm.periodEnd && billingData.period_end) {
      handleInputChange({
        target: { name: "periodEnd", value: toDateInputValue(billingData.period_end) },
      } as any);
    }
  }, [isOpen, billingData]);

  const computedRates = useMemo(() => {
    const eTotal = Number(billingForm.electricityTotal);
    const eCons = Number(billingForm.electricityConsumption);
    const wTotal = Number(billingForm.waterTotal);
    const wCons = Number(billingForm.waterConsumption);
    return {
      electricityRate: eTotal > 0 && eCons > 0 ? eTotal / eCons : 0,
      waterRate: wTotal > 0 && wCons > 0 ? wTotal / wCons : 0,
    };
  }, [billingForm.electricityTotal, billingForm.electricityConsumption, billingForm.waterTotal, billingForm.waterConsumption]);

  const canSave =
    billingForm.periodStart &&
    billingForm.periodEnd &&
    (propertyDetails?.electricity_billing_type !== "submetered" ||
      (Number(billingForm.electricityTotal) > 0 && Number(billingForm.electricityConsumption) > 0)) &&
    (propertyDetails?.water_billing_type !== "submetered" ||
      (Number(billingForm.waterTotal) > 0 && Number(billingForm.waterConsumption) > 0));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border flex flex-col">
          {/* HEADER */}
          <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b flex justify-between items-start gap-3 z-10">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Set Utility Rates</h2>
                  <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Enter your utility bill to set rates for the current month
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Monthly Billing - uses current month's created_at */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-semibold text-gray-800">Billing Period</label>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Rates will be saved for the current month using the date of entry.
              </p>
            </div>

            {/* Electricity */}
            {propertyDetails?.electricity_billing_type === "submetered" && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Electricity (Meralco)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Total kWh</label>
                    <input
                      type="number"
                      name="electricityConsumption"
                      value={billingForm.electricityConsumption}
                      onChange={handleInputChange}
                      placeholder="e.g., 320"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Total Amount (₱)</label>
                    <input
                      type="number"
                      name="electricityTotal"
                      value={billingForm.electricityTotal}
                      onChange={handleInputChange}
                      placeholder="e.g., 4928"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {computedRates.electricityRate > 0 && (
                  <div className="bg-white rounded-lg border border-amber-200 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Rate per kWh</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(computedRates.electricityRate)} <span className="text-xs font-normal text-gray-400">/ kWh</span>
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                  </div>
                )}
              </div>
            )}

            {/* Water */}
            {propertyDetails?.water_billing_type === "submetered" && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Droplet className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Water (Maynilad)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Total m³</label>
                    <input
                      type="number"
                      name="waterConsumption"
                      value={billingForm.waterConsumption}
                      onChange={handleInputChange}
                      placeholder="e.g., 45"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Total Amount (₱)</label>
                    <input
                      type="number"
                      name="waterTotal"
                      value={billingForm.waterTotal}
                      onChange={handleInputChange}
                      placeholder="e.g., 1125"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {computedRates.waterRate > 0 && (
                  <div className="bg-white rounded-lg border border-blue-200 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Rate per m³</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(computedRates.waterRate)} <span className="text-xs font-normal text-gray-400">/ m³</span>
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              disabled={!canSave}
              onClick={(e) => {
                handleSaveorUpdateRates(e);
                onBillingUpdated?.({
                  period_start: billingForm.periodStart,
                  period_end: billingForm.periodEnd,
                  electricity: { consumption: Number(billingForm.electricityConsumption) || 0, total: Number(billingForm.electricityTotal) || 0 },
                  water: { consumption: Number(billingForm.waterConsumption) || 0, total: Number(billingForm.waterTotal) || 0 },
                });
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold transition-all ${
                canSave ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {hasBillingForMonth ? "Update Rates" : "Save Rates"}
            </button>
          </div>
        </div>
      </div>

      {/* INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                How Utility Billing Works
              </h3>
              <button onClick={() => setShowInfo(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Enter your <strong>Meralco bill</strong> details for electricity rates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Enter your <strong>Maynilad bill</strong> details for water rates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Rates are automatically linked to the current month via creation date.</span>
              </li>
            </ul>

            <div className="mt-5">
              <button onClick={() => setShowInfo(false)} className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}