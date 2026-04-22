"use client";

import { Building2, FileText, Edit, Clock, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
  paid: { bg: "bg-gradient-to-r from-emerald-50 to-green-50", border: "border-emerald-200", text: "text-emerald-700", icon: CheckCircle, label: "Paid" },
  partial: { bg: "bg-gradient-to-r from-amber-50 to-yellow-50", border: "border-amber-200", text: "text-amber-700", icon: Clock, label: "Partial" },
  draft: { bg: "bg-gradient-to-r from-slate-50 to-gray-50", border: "border-slate-200", text: "text-slate-700", icon: Edit, label: "Draft" },
  no_bill: { bg: "bg-gradient-to-r from-blue-50 to-indigo-50", border: "border-blue-200", text: "text-blue-700", icon: FileText, label: "No Bill" },
  overdue: { bg: "bg-gradient-to-r from-red-50 to-rose-50", border: "border-red-200", text: "text-red-700", icon: AlertCircle, label: "Overdue" },
};

export default function BillingUnitTableDesktop({
  bills,
  router,
  property_id,
  guardActionWithConfig,
}: any) {
  if (!bills.length) return null;

  return (
    <div
      id="units-list-section"
      className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Units Billing List
        </h3>
      </div>
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-transparent">
          <tr>
            {["Unit", "Tenant", "Period", "Amount", "Status", "Actions"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bills.map((bill: any) => {
            const status = statusConfig[bill.billing_status as keyof typeof statusConfig] || statusConfig.overdue;
            const StatusIcon = status.icon;
            return (
              <tr key={bill.unit_id} className="group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">{bill.unit_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{bill.tenant_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {bill.billing_period
                      ? new Date(bill.billing_period).toLocaleDateString()
                      : "-"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className="text-base font-bold text-gray-900">
                    ₱{Number(bill.total_amount_due).toLocaleString("en-PH")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${status.bg} ${status.border}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${status.text}`} />
                    <span className={`text-xs font-bold ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      guardActionWithConfig(() =>
                        router.push(
                          `/landlord/properties/${property_id}/billing/createUnitBill/${bill.agreement_id || bill.lease_id}`,
                        ),
                      )
                    }
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                  >
                    {bill.billing_status === "draft" || bill.billing_status === "no_bill" ? "Create Bill" : "Open"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
