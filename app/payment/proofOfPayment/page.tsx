"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

export default function PaymentFormPage() {
  return (
      <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-screen">
              <div className="animate-pulse text-xl text-gray-600">
                Loading...
              </div>
            </div>
          }
      >
        <PaymentForm />
      </Suspense>
  );
}

const PaymentForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id") || "";
  const queryAmount = searchParams.get("amountPaid") || "";
  const billingId = searchParams.get("billingId") || "";

  const fixedPaymentMethods = [
    { id: "online_bank_transfer", name: "Online Bank Transfer" },
    { id: "manual_bank_transfer", name: "Manual Bank Transfer" },
    { id: "others", name: "Others (Non-digital)" },
  ];

  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState(queryAmount || "");
  const [file, setFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10485760, // 10MB
  });

  useEffect(() => {
    if (billingId) setPaymentType("billing");
  }, [billingId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setSuccessMessage("");

        try {
            if (!agreement_id) throw new Error("Missing agreement ID. Please go back and try again.");
            if (!amountPaid || Number(amountPaid) <= 0) throw new Error("Please enter a valid payment amount.");
            if (!["billing", "security_deposit", "advance_rent"].includes(paymentType))
                throw new Error("Please select a valid payment type.");

            if (!file) throw new Error("Please upload a proof of payment file.");

            const formData = new FormData();
            formData.append("agreement_id", agreement_id);
            formData.append("paymentMethod", paymentMethod || "manual");
            formData.append("amountPaid", amountPaid);
            formData.append("paymentType", paymentType);
            if (billingId) formData.append("billingId", billingId);
            formData.append("proof", file);

            const res = await fetch("/api/payment/upload-proof-of-payment", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed. Please try again.");
            }

            setSuccessMessage("✅ Payment proof uploaded successfully! Redirecting...");
            console.log("Upload success:", data);

            // optional: toast or UI feedback
            // toast.success("Payment proof uploaded successfully!");

            // redirect after short delay
            setTimeout(() => {
                router.push(`/pages/tenant/billing?agreement_id=${agreement_id}`);
            }, 2000);
        } catch (err: any) {
            console.error("Error submitting payment:", err);
            setError(err.message || "An unexpected error occurred while uploading proof.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header Info */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Billing Information
            </h2>
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong>Agreement ID:</strong> {agreement_id || "—"}
              </p>
              <p>
                <strong>Billing ID:</strong>{" "}
                <span className="text-indigo-600 font-semibold">
                {billingId || "—"}
              </span>
              </p>
              <p>
                <strong>Amount Due:</strong>{" "}
                <span className="text-emerald-600 font-semibold">
                ₱
                  {parseFloat(amountPaid || "0").toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <form
              onSubmit={handleSubmit}
              className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100"
          >
            <div className="px-6 py-8 space-y-6">
              {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md text-sm">
                    {error}
                  </div>
              )}
              {successMessage && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-md text-sm">
                    {successMessage}
                  </div>
              )}

              {/* Payment Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Type
                </label>
                <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                >
                  <option value="" disabled>
                    Select payment type
                  </option>
                  <option value="billing">Billing</option>
                  <option value="security_deposit">Security Deposit</option>
                  <option value="advance_rent">Advance Rent</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                >
                  <option value="" disabled>
                    Select payment method
                  </option>
                  {fixedPaymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                  ))}
                </select>
              </div>

              {/* Amount Paid */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Amount Paid
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Proof of Payment (Always visible) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Payment (optional )
                </label>
                <div
                    {...getRootProps()}
                    className={`mt-1 border-2 border-dashed ${
                        file
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-gray-300 bg-gray-50"
                    } rounded-lg px-6 pt-5 pb-6 flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <svg
                        className={`mx-auto h-12 w-12 ${
                            file ? "text-indigo-500" : "text-gray-400"
                        }`}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                      <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {file ? (
                          <span className="font-medium text-indigo-600">
                        {file.name}
                      </span>
                      ) : (
                          "Click or drag file to upload proof"
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white ${
                      isSubmitting
                          ? "bg-indigo-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  }`}
              >
                {isSubmitting ? (
                    <>
                      <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                ) : (
                    "Submit Payment"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};
