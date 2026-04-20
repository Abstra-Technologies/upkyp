"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Calendar,
  CreditCard,
  Eye,
  ChevronRight,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

interface Payment {
  payment_id: number;
  amount_paid: number;
  payment_status: string;
  payment_method_name?: string;
  payment_date: string;
  receipt_reference?: string;
  proof_of_payment?: string;
  payment_type?: string;
}

export default function LeasePayments({ lease }: { lease: any }) {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!lease?.lease_id) return;

    const fetchPayments = async () => {
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/paymentsList?agreement_id=${lease.lease_id}`,
        );
        setData(res.data || []);
      } catch (err) {
        console.error("Error fetching lease payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [lease?.lease_id]);

  const handleRowClick = (payment: Payment) => {
    router.push(`/landlord/payment/details/${payment.payment_id}`);
  };

  // Filter payments based on search
  const filteredPayments = data.filter((payment) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.payment_type?.toLowerCase().includes(query) ||
      payment.payment_method_name?.toLowerCase().includes(query) ||
      payment.receipt_reference?.toLowerCase().includes(query) ||
      payment.payment_status?.toLowerCase().includes(query)
    );
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      confirmed: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      },
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      },
      rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    };
    return configs[status?.toLowerCase()] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-5">
          <Receipt className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
          No Payments Yet
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Payment records will appear here once transactions are made for this
          lease.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">
              Payment Records
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            {filteredPayments.length} payment
            {filteredPayments.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Proof
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map((payment, index) => {
                const statusConfig = getStatusConfig(payment.payment_status);
                return (
                  <tr
                    key={payment.payment_id}
                    onClick={() => handleRowClick(payment)}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(payment.amount_paid)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-medium">
                        {payment.payment_type || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {payment.payment_method_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-mono">
                        {payment.receipt_reference || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {payment.proof_of_payment ? (
                        <a
                          href={payment.proof_of_payment}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-3">
        {filteredPayments.map((payment) => {
          const statusConfig = getStatusConfig(payment.payment_status);
          return (
            <div
              key={payment.payment_id}
              onClick={() => handleRowClick(payment)}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer active:scale-[0.99] transition-all hover:shadow-md hover:border-gray-200"
            >
              {/* Top Row: Date & Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(payment.payment_date)}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {payment.payment_status}
                </span>
              </div>

              {/* Amount */}
              <div className="text-2xl font-bold text-emerald-600 mb-3">
                {formatCurrency(payment.amount_paid)}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Type</p>
                  <p className="text-gray-900 font-medium">
                    {payment.payment_type || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Method</p>
                  <p className="text-gray-900 font-medium">
                    {payment.payment_method_name || "—"}
                  </p>
                </div>
                {payment.receipt_reference && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-0.5">Reference</p>
                    <p className="text-gray-900 font-mono text-sm">
                      {payment.receipt_reference}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                {payment.proof_of_payment ? (
                  <a
                    href={payment.proof_of_payment}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Proof
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">
                    No proof uploaded
                  </span>
                )}

                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filteredPayments.length === 0 && data.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payments match your search.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
