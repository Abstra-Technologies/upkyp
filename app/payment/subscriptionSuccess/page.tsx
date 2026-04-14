"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import { Home, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const SearchParamsWrapper = ({
                                 setRequestReferenceNumber,
                                 setLandlordId,
                                 setPlanName,
                                 setAmount,
                             }) => {
    const searchParams = useSearchParams();
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const landlord_id = searchParams.get("landlord_id");
    const plan_name = searchParams.get("plan_name");
    const amount = searchParams.get("amount");

    useEffect(() => {
        if (requestReferenceNumber && landlord_id && plan_name && amount) {
            setRequestReferenceNumber(requestReferenceNumber);
            setLandlordId(landlord_id);
            setPlanName(plan_name);
            setAmount(amount);
        }
    }, [
        requestReferenceNumber,
        landlord_id,
        plan_name,
        amount,
        setRequestReferenceNumber,
        setLandlordId,
        setPlanName,
        setAmount,
    ]);

    return null;
};

function PaymentReceiptPage() {
    const router = useRouter();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [requestReferenceNumber, setRequestReferenceNumber] = useState<string | null>(null);
    const [landlord_id, setLandlordId] = useState<string | null>(null);
    const [plan_name, setPlanName] = useState<string | null>(null);
    const [amount, setAmount] = useState<string | null>(null);
    const [message, setMessage] = useState("Processing your payment...");
    const [loading, setLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [datePaid, setDatePaid] = useState("");

    useEffect(() => {
        async function updateSubscriptionStatus() {
            if (!requestReferenceNumber || !landlord_id || !plan_name || !amount) return;

            // 🧭 Determine which redirect page you're currently on
            const pathname = window.location.pathname.toLowerCase();
            let status: "success" | "failed" | "cancelled" = "success";

            if (pathname.includes("failed")) status = "failed";
            else if (pathname.includes("cancelled")) status = "cancelled";

            try {
                const response = await axios.post("/api/payment/status", {
                    requestReferenceNumber,
                    landlord_id,
                    plan_name,
                    amount,
                    status, // 🔹 send unified status field
                });

                if (status === "success") {
                    setMessage(
                        response.data.message ||
                        "Your subscription has been activated successfully."
                    );
                    setIsError(false);
                } else if (status === "failed") {
                    setMessage("Payment failed. Please try again or contact support.");
                    setIsError(true);
                } else {
                    setMessage("Payment was cancelled. You may try again anytime.");
                    setIsError(true);
                }

                setDatePaid(
                    new Date().toLocaleString("en-PH", {
                        dateStyle: "long",
                        timeStyle: "short",
                    })
                );
            } catch (error: any) {
                console.error("Payment update failed:", error.response?.data || error.message);
                setIsError(true);
                setMessage(
                    "Unable to update subscription status. Please contact support if payment was deducted."
                );
            } finally {
                setLoading(false);
            }
        }

        if (requestReferenceNumber && landlord_id && plan_name && amount) {
            updateSubscriptionStatus();
        }
    }, [requestReferenceNumber, landlord_id, plan_name, amount]);

    // 📸 Download the receipt as an image (using html2canvas)
    const handleDownloadImage = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `UpKyp_Receipt_${requestReferenceNumber || "receipt"}.png`;
            link.href = imgData;
            link.click();
        } catch (error) {
            console.error("Error downloading receipt image:", error);
        }
    };

    return (
        <Suspense fallback={<div>Loading receipt...</div>}>
            <SearchParamsWrapper
                setRequestReferenceNumber={setRequestReferenceNumber}
                setLandlordId={setLandlordId}
                setPlanName={setPlanName}
                setAmount={setAmount}
            />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-white flex flex-col items-center justify-center p-6">
                {/* Receipt Container */}
                <div
                    ref={receiptRef}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-gray-100"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo/upkyp-logo.png"
                                alt="UpKyp Logo"
                                className="w-10 h-10 object-contain"
                            />
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900">UpKyp</h1>
                                <p className="text-xs text-gray-500">
                                    Property Management Platform
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase">
              Official Receipt
            </span>
                    </div>

                    {/* Status */}
                    <div className="text-center mb-8">
                        {loading ? (
                            <Loader2 className="h-14 w-14 text-blue-600 mx-auto animate-spin" />
                        ) : isError ? (
                            <XCircle className="h-14 w-14 text-red-500 mx-auto" />
                        ) : (
                            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                        )}

                        <h2
                            className={`text-xl font-semibold mt-4 ${
                                loading
                                    ? "text-blue-700"
                                    : isError
                                        ? "text-red-600"
                                        : "text-emerald-600"
                            }`}
                        >
                            {loading
                                ? "Processing Payment..."
                                : isError
                                    ? "Payment Failed"
                                    : "Payment Successful"}
                        </h2>
                        <p className="text-gray-600 mt-1">{message}</p>
                    </div>

                    {/* Receipt Details */}
                    {!loading && (
                        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-700 space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="font-semibold">Plan:</span>
                                <span>{plan_name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Amount Paid:</span>
                                <span>₱{parseFloat(amount || "0").toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Reference No.:</span>
                                <span>{requestReferenceNumber || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Landlord ID:</span>
                                <span>{landlord_id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Date Paid:</span>
                                <span>{datePaid}</span>
                            </div>
                        </div>
                    )}

                    {/* Page_footer */}
                    <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                        <p>
                            Thank you for subscribing to <strong>UpKyp</strong>!
                            You now have access to all premium features on your dashboard.
                        </p>
                        <p className="mt-1 italic">
                            This is a system-generated receipt. No signature required.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <button
                        onClick={handleDownloadImage}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
                            loading
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:opacity-90"
                        }`}
                    >
                        <Download className="h-5 w-5" />
                        Download Receipt (Image)
                    </button>

                    <button
                        onClick={() => router.push("/pages/landlord/dashboard")}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
                            loading
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gray-900 hover:bg-gray-800"
                        }`}
                    >
                        <Home className="h-5 w-5" />
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </Suspense>
    );
}

export default PaymentReceiptPage;
