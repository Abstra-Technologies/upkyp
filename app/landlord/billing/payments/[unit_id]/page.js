"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";

export default function PaymentManagement() {
  const router = useRouter();
  const { unit_id } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unit_id) return;

    async function fetchPayments() {
      try {
        const res = await fetch(
          `/api/landlord/payments/getPayments?unit_id=${unit_id}`
        );
        const data = await res.json();

        console.log(data);
        if (res.ok) {
          setPayments(data);
        } else {
          setError(data.message || "Failed to fetch payments.");
        }
      } catch (err) {
        setError("Error fetching payments.");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [unit_id]);

  const updatePayment = async (payment_id, status, type) => {
    try {
      const res = await fetch(`/api/landlord/payments/updatePayment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id,
          payment_status: status,
          payment_type: type,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPayments((prevPayments) =>
          prevPayments.map((p) =>
            p.payment_id === payment_id
              ? { ...p, payment_status: status, payment_type: type }
              : p
          )
        );
      } else {
        Swal.fire({
          icon: "info",
          title: "Notice",
          text: data.message,
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error updating payment.",
      });
    }
  };

  if (loading) return <p>Loading payments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (payments.length === 0) return <p>No payments found.</p>;

  return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Payment Management
          </h1>
          <div className="hidden md:block">
            {/* You could add search/filter here if needed */}
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proof
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr
                  key={payment.payment_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    {payment.payment_type
                      .replace("_", " ")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium">
                    ₱{payment.amount_paid}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {payment.method_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {new Date(payment.payment_date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={payment.payment_status}
                      onChange={(e) =>
                        updatePayment(
                          payment.payment_id,
                          e.target.value,
                          payment.payment_type
                        )
                      }
                      className={`rounded px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        payment.payment_status === "confirmed"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : payment.payment_status === "pending"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {payment.proof_of_payment ? (
                      <a
                        href={payment.proof_of_payment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Proof
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No proof uploaded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() =>
                        updatePayment(
                          payment.payment_id,
                          "confirmed",
                          payment.payment_type
                        )
                      }
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Confirm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>
  );
}
