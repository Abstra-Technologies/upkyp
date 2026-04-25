"use client";

import React from "react";
import { BackButton } from "@/components/navigation/backButton";
import UtilityRatesCard from "@/components/landlord/unitBilling/UtilityRatesCard";
import PDCCard from "@/components/landlord/unitBilling/PDCCard";
import { useCreateSubmeteredUnitBill } from "@/hooks/landlord/billing/useCreateSubmeteredUnitBill";
import {
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

function BillingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    loading,
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

  if (loading || !unit || !property) {
    return <BillingSkeleton />;
  }

  const hasSubmetered = property.water_billing_type === "submetered" || property.electricity_billing_type === "submetered";

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      {/* ================= HEADER ================= */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 lg:static">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
          <BackButton
            label="Back"
            fallback={`/landlord/properties/${property.property_id}/units/details/${property.property_id}`}
          />

          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Billing Statement
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{property.property_name}</span>
                <span className="text-gray-300">/</span>
                <Home className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Unit {unit.unit_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* ================= FORM HEADER ================= */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Details</span>
              <span className="text-right">Summary</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* ================= LEFT: EDITABLE ================= */}
            <div className="p-4 space-y-4">
              {/* Billing Period */}
              <div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Billing Period
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Period</label>
                    <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium">
                      {new Date(form.billingDate).toLocaleString("en-PH", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Billing Date</label>
                    <input
                      type="date"
                      name="readingDate"
                      value={form.billingDate}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Due Date</label>
                    <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                      {new Date(form.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Base Rent */}
              <div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home className="w-3 h-3" />
                  Base Rent
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="font-medium">₱{bill.rent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {bill.dues > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Association Dues</span>
                      <span className="font-medium">₱{bill.dues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
                {pdc && (
                  <div className="mt-2">
                    <PDCCard pdc={pdc} loadingPdc={loadingPdc} handleMarkCleared={handleMarkCleared} />
                  </div>
                )}
              </div>

              {/* Utility Rates */}
              {hasSubmetered && (
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    Utility Rates
                  </h3>
                  <UtilityRatesCard property={property} propertyRates={propertyRates} />
                </div>
              )}

              {/* Meter Readings */}
              {hasSubmetered && (
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Meter Readings
                  </h3>
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-5 text-[10px] font-medium text-gray-500 border-b border-gray-200 pb-1">
                      <span>Utility</span>
                      <span className="text-right">Prev</span>
                      <span className="text-right">Curr</span>
                      <span className="text-right">Usage</span>
                      <span className="text-right">Cost</span>
                    </div>

                    {property.water_billing_type === "submetered" && (
                      <div className="grid grid-cols-5 items-center">
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-medium">Water</span>
                        </div>
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded px-1.5 py-1 text-xs focus:border-blue-500 outline-none"
                          value={form.waterPrevReading}
                          onChange={(e) => setForm((p) => ({ ...p, waterPrevReading: e.target.value }))}
                          placeholder="0"
                        />
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded px-1.5 py-1 text-xs focus:border-blue-500 outline-none"
                          value={form.waterCurrentReading}
                          onChange={(e) => setForm((p) => ({ ...p, waterCurrentReading: e.target.value }))}
                          placeholder="0"
                        />
                        <span className="text-right text-xs">{bill.waterUsage}</span>
                        <span className="text-right text-xs font-semibold text-blue-600">₱{bill.waterCost.toLocaleString()}</span>
                      </div>
                    )}

                    {property.electricity_billing_type === "submetered" && (
                      <div className="grid grid-cols-5 items-center">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-medium">Elec</span>
                        </div>
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded px-1.5 py-1 text-xs focus:border-blue-500 outline-none"
                          value={form.electricityPrevReading}
                          onChange={(e) => setForm((p) => ({ ...p, electricityPrevReading: e.target.value }))}
                          placeholder="0"
                        />
                        <input
                          type="number"
                          className="w-full text-right border border-gray-200 rounded px-1.5 py-1 text-xs focus:border-blue-500 outline-none"
                          value={form.electricityCurrentReading}
                          onChange={(e) => setForm((p) => ({ ...p, electricityCurrentReading: e.target.value }))}
                          placeholder="0"
                        />
                        <span className="text-right text-xs">{bill.elecUsage}</span>
                        <span className="text-right text-xs font-semibold text-amber-600">₱{Number(bill.elecCost).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Adjustments */}
              <div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Adjustments</h3>
                <div className="space-y-3">
                  {/* Additional Charges */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Plus className="w-3 h-3 text-red-500" /> Charges
                      </span>
                      <button
                        onClick={handleAddExpense}
                        className="px-2 py-0.5 border border-gray-200 text-[10px] text-red-600 rounded hover:bg-red-50"
                      >
                        + Add
                      </button>
                    </div>
                    {extraExpenses.length === 0 ? (
                      <p className="text-[10px] text-gray-400">No charges</p>
                    ) : (
                      <div className="space-y-1.5">
                        {extraExpenses.map((exp, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                              value={exp.type}
                              onChange={(e) => handleExpenseChange(idx, "type", e.target.value)}
                              placeholder="Description"
                            />
                            <div className="relative w-20">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                              <input
                                type="number"
                                className="w-full border border-gray-200 rounded pl-5 pr-1 py-1 text-xs text-right focus:border-blue-500 outline-none"
                                value={exp.amount}
                                onChange={(e) => handleExpenseChange(idx, "amount", e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <button onClick={() => handleRemoveExpense(idx, exp)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discounts */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-emerald-500" /> Discounts
                      </span>
                      <button
                        onClick={handleAddDiscount}
                        className="px-2 py-0.5 border border-gray-200 text-[10px] text-emerald-600 rounded hover:bg-emerald-50"
                      >
                        + Add
                      </button>
                    </div>
                    {discounts.length === 0 ? (
                      <p className="text-[10px] text-gray-400">No discounts</p>
                    ) : (
                      <div className="space-y-1.5">
                        {discounts.map((disc, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                              value={disc.type}
                              onChange={(e) => handleDiscountChange(idx, "type", e.target.value)}
                              placeholder="Description"
                            />
                            <div className="relative w-20">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                              <input
                                type="number"
                                className="w-full border border-gray-200 rounded pl-5 pr-1 py-1 text-xs text-right focus:border-blue-500 outline-none"
                                value={disc.amount}
                                onChange={(e) => handleDiscountChange(idx, "amount", e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <button onClick={() => handleRemoveDiscount(idx, disc)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT: SUMMARY ================= */}
            <div className="p-4 bg-gray-50">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Receipt className="w-3 h-3" />
                Billing Summary
              </h3>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Rent</span>
                  <span className="font-medium">₱{bill.rent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>

                {bill.dues > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">Association Dues</span>
                    <span className="font-medium">₱{bill.dues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {hasSubmetered && property.water_billing_type === "submetered" && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      Water ({bill.waterUsage} m³)
                    </span>
                    <span className="font-medium">₱{bill.waterCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {hasSubmetered && property.electricity_billing_type === "submetered" && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Electricity ({bill.elecUsage} kWh)
                    </span>
                    <span className="font-medium">₱{Number(bill.elecCost).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {bill.totalExtraCharges > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-red-500" />
                      Additional Charges
                    </span>
                    <span className="font-medium text-red-600">+₱{bill.totalExtraCharges.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {bill.totalDiscounts > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-500" />
                      Discounts
                    </span>
                    <span className="font-medium text-emerald-600">-₱{bill.totalDiscounts.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {bill.pdcAmount > 0 && pdc && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      PDC {bill.pdcCleared ? "(Applied)" : "(Pending)"}
                    </span>
                    <span className="font-medium text-blue-600">-₱{bill.pdcCoveredAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="border-t-2 border-gray-900 pt-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Amount Due</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₱{bill.adjustedTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={hasExistingBilling ? updateBilling : handleSubmit}
                  className={`w-full mt-4 py-3 rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-2 ${
                    hasExistingBilling
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}