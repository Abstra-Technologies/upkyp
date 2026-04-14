"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function billCancelledPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingCancelled />
    </Suspense>
  );
}

function BillingCancelled() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const amount = searchParams.get("amount");
  const requestReferenceNumber = searchParams.get("requestReferenceNumber");
  const tenant_id = searchParams.get("tenant_id");
  const billing_id = searchParams.get("billing_id");
const agreement_id = searchParams.get("agreement_id");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [message, setMessage] = useState("Cancelling transaction...");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function updateBillStatus() {
      try {
        await axios.post("/api/payment/updateBillingPaymentStatus", {
          tenant_id,
          requestReferenceNumber,
          amount,
          billing_id,
          payment_status: "cancelled",

        });
        setMessage("Your payment Cancellation was Successful");
      } catch (error) {
        setMessage(`Failed to update payment status. ${error}`);
      } finally {
        setLoading(false);
      }
    }

    if (amount && requestReferenceNumber && tenant_id && billing_id) {
      updateBillStatus();
    }
  }, [amount, requestReferenceNumber, tenant_id, billing_id]);

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
            {!loading ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="animate-spin w-8 h-8 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                  <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                  ></circle>
                  <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
            )}
          </div>

          {/* Title */}
          <h2
              className={`text-2xl font-extrabold mb-2 ${
                  loading ? "text-yellow-600" : "text-red-600"
              }`}
          >
            {loading ? "Processing Cancellation..." : "Payment Cancelled"}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

          {/* Divider */}
          <div className="my-5 border-t border-gray-200" />

          {/* Button */}
          <button
              onClick={() => router.replace(`/pages/tenant/billing?agreement_id=${agreement_id}`)
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow hover:from-blue-700 hover:to-emerald-700 transition-all duration-200"
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
  );

}
