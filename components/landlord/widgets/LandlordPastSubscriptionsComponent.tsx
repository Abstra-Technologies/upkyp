"use client";
import { useEffect, useState } from "react";

interface PastSubscription {
  subscription_id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  payment_status: "paid" | "unpaid" | "pending" | "failed";
  request_reference_number: string;
  is_trial: 0 | 1;
  amount_paid: number;
}

export default function LandlordPastSubscriptionsComponent({
  landlord_id,
}: {
  landlord_id: number | undefined;
}) {
  const [subscriptions, setSubscriptions] = useState<PastSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchPastSubscriptions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/landlord/${landlord_id}/subscription`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubscriptions(data);
        } else if (data?.data && Array.isArray(data.data)) {
          setSubscriptions(data.data);
        } else {
          setSubscriptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch past subscriptions", error);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastSubscriptions();
  }, [landlord_id]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
        <p className="mt-2 text-xs text-gray-500">
          Loading past subscriptions...
        </p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">No past subscriptions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Mobile View */}
      <div className="sm:hidden space-y-2">
        {subscriptions.map((sub) => (
          <div
            key={sub.subscription_id}
            className="bg-gray-50 rounded-md p-3 border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-gray-400 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{sub.plan_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sub.request_reference_number}
                  {sub.is_trial ? " (Trial)" : ""}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                  sub.payment_status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : sub.payment_status === "unpaid"
                    ? "bg-red-50 text-red-700 border-red-300"
                    : sub.payment_status === "pending"
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }`}
              >
                {sub.payment_status}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Period</span>
                <span className="text-gray-900">
                  {new Date(sub.start_date).toLocaleDateString()} –{" "}
                  {new Date(sub.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">
                  ₱{Number(sub.amount_paid).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr
                key={sub.subscription_id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2 text-xs font-medium text-gray-900">
                  {sub.plan_name}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                  {new Date(sub.start_date).toLocaleDateString()} –{" "}
                  {new Date(sub.end_date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {sub.request_reference_number}{" "}
                  {sub.is_trial && (
                    <span className="text-blue-600 font-medium">(Trial)</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                      sub.payment_status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : sub.payment_status === "unpaid"
                        ? "bg-red-50 text-red-700 border-red-300"
                        : sub.payment_status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {sub.payment_status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right">
                  ₱{Number(sub.amount_paid).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
