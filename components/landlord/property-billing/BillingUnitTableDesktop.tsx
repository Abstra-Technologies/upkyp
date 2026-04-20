"use client";

import { Building2 } from "lucide-react";

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
      className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Unit", "Tenant", "Period", "Amount", "Status", "Actions"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {bills.map((bill: any) => (
            <tr key={bill.unit_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                {bill.unit_name}
              </td>
              <td className="px-4 py-3">{bill.tenant_name}</td>
              <td className="px-4 py-3">
                {bill.billing_period
                  ? new Date(bill.billing_period).toLocaleDateString()
                  : "-"}
              </td>

              <td className="px-4 py-3 font-bold">
                ₱{Number(bill.total_amount_due).toLocaleString("en-PH")}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    bill.billing_status === "paid"
                      ? "bg-green-100 text-green-700"
                      : bill.billing_status === "partial"
                      ? "bg-yellow-100 text-yellow-700"
                      : bill.billing_status === "draft"
                      ? "bg-gray-100 text-gray-700"
                      : bill.billing_status === "no_bill"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {bill.billing_status === "no_bill" ? "No Bill" : bill.billing_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() =>
                    guardActionWithConfig(() =>
                      router.push(
                        `/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`,
                      ),
                    )
                  }
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
