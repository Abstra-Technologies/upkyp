"use client";

import { Building2, FileText, Edit, Clock, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
  paid: { bg: "from-emerald-500 to-green-500", text: "text-emerald-700", icon: CheckCircle, label: "Paid" },
  partial: { bg: "from-amber-500 to-yellow-500", text: "text-amber-700", icon: Clock, label: "Partial" },
  draft: { bg: "from-slate-500 to-gray-500", text: "text-slate-700", icon: Edit, label: "Draft" },
  no_bill: { bg: "from-blue-500 to-indigo-500", text: "text-blue-700", icon: FileText, label: "No Bill" },
  overdue: { bg: "from-red-500 to-rose-500", text: "text-red-700", icon: AlertCircle, label: "Overdue" },
};

export default function BillingUnitListMobile({
  bills,
  propertyDetails,
  router,
  property_id,
  guardActionWithConfig,
}: any) {
  if (!bills.length) return null;

  return (
    <div
      id="units-list-section-mobile"
      className="block md:hidden space-y-2 mb-4"
    >
      {bills.map((bill: any) => {
        const status = statusConfig[bill.billing_status as keyof typeof statusConfig] || statusConfig.overdue;
        const StatusIcon = status.icon;
        return (
          <div
            key={bill.unit_id}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <Building2 className="w-3.5 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{bill.unit_name}</h3>
                  <p className="text-[10px] text-gray-400 truncate">{bill.tenant_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">
                    ₱{Number(bill.total_amount_due).toLocaleString("en-PH")}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r ${status.bg}`}>
                    <StatusIcon className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] font-bold text-white">
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                guardActionWithConfig(() =>
                  router.push(
                    `/landlord/properties/${property_id}/billing/createUnitBill/${bill.agreement_id || bill.lease_id}`,
                  ),
                )
              }
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {bill.billing_status === "draft" || bill.billing_status === "no_bill" ? (
                <>
                  <Edit className="w-3 h-3" /> Create Bill
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" /> Review
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
