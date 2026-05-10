"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Building2,
  User,
  Zap,
  Droplet,
  Receipt,
  CreditCard,
  PiggyBank,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { formatCurrency } from "@/utils/formatter/formatters";

interface BillingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing_id: string;
  lease_id: string;
  month: number;
  year: number;
}

export default function BillingDetailModal({
  isOpen,
  onClose,
  billing_id,
  lease_id,
  month,
  year,
}: BillingDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const params: any = { lease_id, month: month + 1, year };
        if (billing_id) params.billing_id = billing_id;
        const res = await axios.get("/api/landlord/billing/fullDetails", { params });
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch billing details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen, billing_id, lease_id, month, year]);

  if (!isOpen) return null;

  const billing = data?.billing;
  const lease = data?.lease;
  const charges = data?.additionalCharges || [];
  const payments = data?.payments || [];
  const electricReadings = data?.electricReadings || [];
  const waterReadings = data?.waterReadings || [];

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    unpaid: "bg-amber-100 text-amber-700 border-amber-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
    draft: "bg-gray-100 text-gray-600 border-gray-200",
    finalized: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const statusLabel = billing?.status || "draft";
  const statusBadge = statusColors[statusLabel] || statusColors.draft;

  const totalCharges = charges.reduce((sum: number, c: any) => {
    return c.charge_category === "additional" ? sum + c.amount : sum;
  }, 0);
  const totalDiscounts = charges.reduce((sum: number, c: any) => {
    return c.charge_category === "discount" ? sum + c.amount : sum;
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full md:max-w-lg max-h-[90dvh] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Billing Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading details...</span>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Receipt className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-900">No data found</p>
              <p className="text-xs text-gray-500 mt-1">Unable to load billing details</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Status header */}
              <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {billing?.billing_period
                      ? new Date(billing.billing_period + "T00:00:00").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : `${month + 1}/${year}`}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge}`}
                >
                  {statusLabel === "paid" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : statusLabel === "overdue" ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                </span>
              </div>

              {/* Lease & tenant info */}
              {lease && (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 font-semibold">
                      {lease.unit_name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700">
                      {lease.tenant_name || "Unknown Tenant"}
                    </span>
                  </div>
                  {billing?.due_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">
                        Due:{" "}
                        {new Date(billing.due_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {billing?.paid_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-gray-700">
                        Paid:{" "}
                        {new Date(billing.paid_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rent */}
              {lease && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Current Rent</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(lease.rent_amount || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Electric meter readings */}
              {electricReadings.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Electricity
                    </span>
                  </div>
                  {electricReadings.map((r: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Previous</span>
                          <p className="font-semibold text-gray-700">{r.previous_reading} kWh</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Current</span>
                          <p className="font-semibold text-gray-700">{r.current_reading} kWh</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Consumed</span>
                          <p className="font-semibold text-gray-900">{r.consumption} kWh</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Total Electric</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(billing?.total_electricity_amount || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Water meter readings */}
              {waterReadings.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Water
                    </span>
                  </div>
                  {waterReadings.map((r: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Previous</span>
                          <p className="font-semibold text-gray-700">{r.previous_reading} m³</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Current</span>
                          <p className="font-semibold text-gray-700">{r.current_reading} m³</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Consumed</span>
                          <p className="font-semibold text-gray-900">{r.consumption} m³</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Total Water</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(billing?.total_water_amount || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Additional charges / discounts */}
              {charges.length > 0 && (
                <div className="px-4 py-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    Additional Charges & Discounts
                  </span>
                  <div className="space-y-1.5">
                    {charges.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {c.charge_category === "additional" ? (
                            <Plus className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-xs text-gray-700">{c.charge_type}</span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            c.charge_category === "additional"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {c.charge_category === "additional" ? "+" : "-"}
                          {formatCurrency(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {payments.length > 0 && (
                <div className="px-4 py-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    Payments
                  </span>
                  <div className="space-y-2">
                    {payments.map((p: any) => (
                      <div
                        key={p.payment_id}
                        className="flex items-center justify-between bg-emerald-50 rounded-lg p-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {p.payment_type?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {p.payment_date
                                ? new Date(p.payment_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                              {p.receipt_reference ? ` · ${p.receipt_reference}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 shrink-0 ml-2">
                          {formatCurrency(p.amount_paid)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Rent</span>
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(lease?.rent_amount || 0)}
                    </span>
                  </div>
                  {(billing?.total_electricity_amount || 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Electricity</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(billing.total_electricity_amount)}
                      </span>
                    </div>
                  )}
                  {(billing?.total_water_amount || 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Water</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(billing.total_water_amount)}
                      </span>
                    </div>
                  )}
                  {totalCharges > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Other Charges</span>
                      <span className="font-semibold text-red-600">
                        +{formatCurrency(totalCharges)}
                      </span>
                    </div>
                  )}
                  {totalDiscounts > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Discounts</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatCurrency(totalDiscounts)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-gray-900">Total Due</span>
                    </div>
                    <span className="text-base font-extrabold text-gray-900">
                      {formatCurrency(billing?.total_amount_due || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        @media (min-width: 768px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
