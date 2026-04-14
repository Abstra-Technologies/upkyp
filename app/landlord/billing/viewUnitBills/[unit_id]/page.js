"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UnitBilling() {
  const router = useRouter();
  const { unit_id } = useParams();
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (unit_id) {
      fetch(`/api/landlord/billing/getAllUnitBill?unit_id=${unit_id}`)
        .then((res) => res.json())
        .then((data) => {
          setBillingData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching billing data:", error);
          setLoading(false);
        });
    }
  }, [unit_id]);

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toISOString().split("T")[0] : "-";
  };

  if (loading)
    return (
      <p className="text-center text-gray-600">Loading billing details...</p>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-semibold mb-6 text-center">
        List of All Unit Billing
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-gray-700 shadow-sm rounded-md">
          <thead className="bg-gray-200">
            <tr className="text-left">
              <th className="p-3 border">Billing Period</th>
              <th className="p-3 border">Water Bill</th>
              <th className="p-3 border">Electricity Bill</th>
              <th className="p-3 border">Penalty</th>
              <th className="p-3 border">Discount</th>
              <th className="p-3 border font-semibold">Total Due</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Due Date</th>
              <th className="p-3 border">Paid At</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {billingData.length > 0 ? (
              billingData.map((bill, index) => (
                <tr
                  key={bill.billing_id || `bill-${index}`}
                  className="text-center hover:bg-gray-100 transition"
                >
                  <td className="p-3 border">
                    {formatDate(bill.billing_period)}
                  </td>
                  <td className="p-3 border">₱{bill.total_water_amount}</td>
                  <td className="p-3 border">
                    ₱{bill.total_electricity_amount}
                  </td>
                  <td className="p-3 border">₱{bill.penalty_amount}</td>
                  <td className="p-3 border">₱{bill.discount_amount}</td>
                  <td className="p-3 border font-semibold">
                    ₱{bill.total_amount_due}
                  </td>
                  <td
                    className={`p-3 border font-medium ${
                      bill.status === "paid"
                        ? "text-green-600"
                        : bill.status === "overdue"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {bill.status}
                  </td>
                  <td className="p-3 border">{formatDate(bill.due_date)}</td>
                  <td className="p-3 border">
                    {bill.paid_at ? formatDate(bill.paid_at) : "Not Paid"}
                  </td>
                  <td className="p-3 border">
                    <button
                      onClick={() =>
                        router.push(
                          `/pages/landlord/billing/editUnitBill/${bill.billing_id}`
                        )
                      }
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center p-6 text-gray-500">
                  No billing records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
