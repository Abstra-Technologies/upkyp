"use client";

import { Building2, FileText, Edit } from "lucide-react";

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
      className="block md:hidden space-y-3 mb-6"
    >
      {bills.map((bill: any) => (
        <div
          key={bill.unit_id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900">{bill.unit_name}</h3>
                <p className="text-xs text-gray-500">{bill.tenant_name}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              guardActionWithConfig(() =>
                router.push(
                  `/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`,
                ),
              )
            }
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-semibold"
          >
            {bill.billing_status === "draft" ? (
              <>
                <Edit className="w-4 h-4" /> Edit Bill
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> Review Bill
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
