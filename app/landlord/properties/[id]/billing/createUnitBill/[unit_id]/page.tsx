"use client";

import React from "react";
import { BackButton } from "@/components/navigation/backButton";
import UtilityRatesCard from "@/components/landlord/unitBilling/UtilityRatesCard";
import PDCCard from "@/components/landlord/unitBilling/PDCCard";
import { useCreateSubmeteredUnitBill } from "@/hooks/landlord/billing/useCreateSubmeteredUnitBill";
import {
  AlertCircle,
  Calendar,
  Receipt,
  Droplets,
  Zap,
  Plus,
  X,
  Building2,
  Home,
  CreditCard,
  Percent,
  FileText,
} from "lucide-react";

// ============================================
// SKELETON LOADING
// ============================================
function BillingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Billing Period Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Base Rent Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center py-3 border-b border-gray-100"
              >
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Utility Readings Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100"
                >
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div
                      key={j}
                      className="h-8 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
            <div className="border-t pt-4 mt-4 flex justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CreateUnitBill() {
  const {
    unit,
    property,
    propertyRates,
    form,
    setForm,
    extraExpenses,
    discounts,
    bill,
    pdc,
    loadingPdc,
    hasExistingBilling,
    handleChange,
    handleAddExpense,
    handleExpenseChange,
    handleRemoveExpense,
    handleAddDiscount,
    handleDiscountChange,
    handleRemoveDiscount,
    handleSubmit,
    handleMarkCleared,
    updateBilling,
  } = useCreateSubmeteredUnitBill();

  if (!unit || !property) {
    return <BillingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-8">
      {/* ================= HEADER ================= */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <BackButton
            label="Back to Units"
            fallback={`/pages/landlord/property-listing/view-unit/${property.property_id}`}
          />

          <div className="flex items-center gap-4 mt-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Billing Statement
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{property.property_name}</span>
                <span className="text-gray-300">•</span>
                <Home className="w-4 h-4" />
                <span>Unit {unit.unit_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================= BILLING PERIOD ================= */}
        <div
          id="billing-period-section"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Billing Period
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Period
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                <p className="font-bold text-gray-900">
                  {new Date(form.billingDate).toLocaleString("en-PH", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Billing Date
              </label>
              <input
                type="date"
                name="readingDate"
                value={form.billingDate}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                readOnly
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ================= BASE RENT ================= */}
        <div
          id="base-rent-section"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" />
              Base Rent
            </h2>
          </div>

          <div className="p-5">
            <div className="divide-y divide-gray-100">
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-semibold text-gray-900">
                  ₱
                  {bill.rent.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Association Dues</span>
                <span className="font-semibold text-gray-900">
                  ₱
                  {bill.dues.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* PDC Card */}
            <div className="mt-4">
              <PDCCard
                pdc={pdc}
                loadingPdc={loadingPdc}
                handleMarkCleared={handleMarkCleared}
              />
            </div>
          </div>
        </div>

        {/* ================= UTILITY RATES ================= */}
        {(property.water_billing_type === "submetered" ||
          property.electricity_billing_type === "submetered") && (
          <div
            id="utility-rates-section"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Utility Rates
              </h2>
            </div>
            <div className="p-5">
              <UtilityRatesCard
                property={property}
                propertyRates={propertyRates}
              />
            </div>
          </div>
        )}

        {/* ================= METER READINGS ================= */}
        {(property.water_billing_type === "submetered" ||
          property.electricity_billing_type === "submetered") && (
          <div
            id="meter-readings-section"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Utility Meter Readings
              </h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block p-5 overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Utility
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Previous
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Current
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {property.water_billing_type === "submetered" && (
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            Water
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          value={form.waterPrevReading}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              waterPrevReading: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          value={form.waterCurrentReading}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              waterCurrentReading: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {bill.waterUsage} m³
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-blue-600">
                          ₱
                          {bill.waterCost.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    </tr>
                  )}

                  {property.electricity_billing_type === "submetered" && (
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            Electricity
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          value={form.electricityPrevReading}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              electricityPrevReading: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          value={form.electricityCurrentReading}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              electricityCurrentReading: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {bill.elecUsage} kWh
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-amber-600">
                          ₱
                          {Number(bill.elecCost).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden p-4 space-y-4">
              {property.water_billing_type === "submetered" && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Water</h3>
                      <p className="text-xs text-gray-500">Meter Reading</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Previous
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={form.waterPrevReading}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            waterPrevReading: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Current
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={form.waterCurrentReading}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            waterCurrentReading: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                    <div>
                      <p className="text-xs text-gray-500">Usage</p>
                      <p className="font-semibold text-gray-900">
                        {bill.waterUsage} m³
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="font-bold text-blue-600 text-lg">
                        ₱
                        {bill.waterCost.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {property.electricity_billing_type === "submetered" && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Electricity
                      </h3>
                      <p className="text-xs text-gray-500">Meter Reading</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Previous
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={form.electricityPrevReading}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            electricityPrevReading: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Current
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={form.electricityCurrentReading}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            electricityCurrentReading: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                    <div>
                      <p className="text-xs text-gray-500">Usage</p>
                      <p className="font-semibold text-gray-900">
                        {bill.elecUsage} kWh
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="font-bold text-amber-600 text-lg">
                        ₱
                        {Number(bill.elecCost).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ADJUSTMENTS ================= */}
        <div
          id="adjustments-section"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        >
          {/* Additional Charges */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                Additional Charges
              </h2>
              <button
                onClick={handleAddExpense}
                className="px-2.5 sm:px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {extraExpenses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No additional charges added
                </p>
              ) : (
                <div className="space-y-3">
                  {extraExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={exp.type}
                        onChange={(e) =>
                          handleExpenseChange(idx, "type", e.target.value)
                        }
                        placeholder="Description"
                      />
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-none">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ₱
                          </span>
                          <input
                            type="number"
                            className="w-full sm:w-28 border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={exp.amount}
                            onChange={(e) =>
                              handleExpenseChange(idx, "amount", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveExpense(idx, exp)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Discounts */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                Discounts
              </h2>
              <button
                onClick={handleAddDiscount}
                className="px-2.5 sm:px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {discounts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No discounts added
                </p>
              ) : (
                <div className="space-y-3">
                  {discounts.map((disc, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={disc.type}
                        onChange={(e) =>
                          handleDiscountChange(idx, "type", e.target.value)
                        }
                        placeholder="Description"
                      />
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-none">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ₱
                          </span>
                          <input
                            type="number"
                            className="w-full sm:w-28 border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={disc.amount}
                            onChange={(e) =>
                              handleDiscountChange(
                                idx,
                                "amount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveDiscount(idx, disc)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= BILLING SUMMARY ================= */}
        <div
          id="billing-summary-section"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-emerald-500">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              Billing Summary
            </h2>
          </div>

          <div className="p-4 sm:p-5">
            <div className="space-y-2 sm:space-y-3">
              {/* Rent */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm">Rent</span>
                <span className="font-medium text-gray-900 text-sm sm:text-base">
                  ₱
                  {bill.rent.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Association Dues */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm">Association Dues</span>
                <span className="font-medium text-gray-900 text-sm sm:text-base">
                  ₱
                  {bill.dues.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Water */}
              {property.water_billing_type === "submetered" && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2 text-sm">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="hidden sm:inline">
                      Water ({bill.waterUsage} m³)
                    </span>
                    <span className="sm:hidden">Water</span>
                  </span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    ₱
                    {bill.waterCost.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Electricity */}
              {property.electricity_billing_type === "submetered" && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">
                      Electricity ({bill.elecUsage} kWh)
                    </span>
                    <span className="sm:hidden">Electricity</span>
                  </span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    ₱
                    {Number(bill.elecCost).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Additional Charges */}
              {bill.totalExtraCharges > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4 text-red-500" />
                    Additional Charges
                  </span>
                  <span className="font-medium text-red-600 text-sm sm:text-base">
                    +₱
                    {bill.totalExtraCharges.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Discounts */}
              {bill.totalDiscounts > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2 text-sm">
                    <Percent className="w-4 h-4 text-emerald-500" />
                    Discounts
                  </span>
                  <span className="font-medium text-emerald-600 text-sm sm:text-base">
                    -₱
                    {bill.totalDiscounts.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* PDC Application */}
              {bill.pdcAmount > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="hidden sm:inline">
                      Post-Dated Check{" "}
                      {bill.pdcCleared ? "(Applied)" : "(Pending)"}
                    </span>
                    <span className="sm:hidden">PDC</span>
                  </span>
                  <span className="font-medium text-blue-600 text-sm sm:text-base">
                    -₱
                    {bill.pdcCoveredAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="border-t-2 border-gray-100 pt-4 mt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                    Total Amount Due
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    ₱
                    {bill.adjustedTotal.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ACTION BUTTON ================= */}
        <div className="flex justify-center sm:justify-end">
          <button
            onClick={hasExistingBilling ? updateBilling : handleSubmit}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              hasExistingBilling
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-blue-500/25"
            }`}
          >
            <Receipt className="w-5 h-5" />
            {hasExistingBilling ? "Update Billing" : "Submit Billing"}
          </button>
        </div>
      </div>
    </div>
  );
}
