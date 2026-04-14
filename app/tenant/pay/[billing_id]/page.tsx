"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import {
    FaSpinner,
    FaCreditCard,
    FaArrowLeft,
    FaFilePdf,
    FaWater,
    FaBolt,
    FaBuilding,
} from "react-icons/fa";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";

export default function TenantBillingPaymentPage() {
    const { billing_id } = useParams();
    const router = useRouter();

    const [billing, setBilling] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, admin, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!billing_id) return;

        async function fetchBilling() {
            try {
                setLoading(true);
                const res = await axios.get(`/api/tenant/billing/previousBilling/${billing_id}`);

                if (res?.data) {
                    const billingData = res.data.billing || res.data || null;
                    if (!billingData) {
                        setError("Billing record not found.");
                        return;
                    }
                    setBilling(billingData);
                } else {
                    setError("Billing record not found.");
                }
            } catch (err: any) {
                console.error("Error fetching billing:", err);
                setError("Failed to load billing details.");
            } finally {
                setLoading(false);
            }
        }

        fetchBilling();
    }, [billing_id]);

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`/api/tenant/payment/${billing_id}`);
            if (!res.ok) throw new Error("Failed to generate PDF");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `billing-statement-${billing_id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading PDF:", err);
            setError("Failed to download billing PDF.");
        }
    };

    // 🔹 Handle Maya Payment
    const handleMayaPayment = async () => {
        if (!billing) return;

        const result = await Swal.fire({
            title: "Billing Payment via Maya",
            text: `Are you sure you want to pay ${formatCurrency(
                billing.total_amount_due
            )} for this billing?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Pay with Maya",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#10B981",
            cancelButtonColor: "#6B7280",
        });

        if (result.isConfirmed) {
            setProcessing(true);
            try {
                const res = await axios.post("/api/tenant/billing/payment", {
                    amount: billing.total_amount_due,
                    billing_id,
                    tenant_id: user?.tenant_id,
                    payment_method_id: 7,
                    redirectUrl: {
                        success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
                        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
                        cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billCancelled`,
                    },
                });

                if (res.data?.checkoutUrl) {
                    window.location.href = res.data.checkoutUrl;
                } else {
                    throw new Error("Missing checkout URL in response");
                }
            } catch (error) {
                console.error("Payment error:", error);
                await Swal.fire({
                    icon: "error",
                    title: "Payment Failed",
                    text: "Unable to process your payment. Please try again.",
                });
            } finally {
                setProcessing(false);
            }
        }
    };

    const dueDate = (() => {
        if (!billing?.billing_period || !billing?.property?.billingDueDay) return null;
        const billingPeriod = new Date(billing.billing_period);
        const year = billingPeriod.getFullYear();
        const month = billingPeriod.getMonth();
        const dueDay = billing.property.billingDueDay;
        return new Date(year, month, dueDay);
    })();

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <FaSpinner className="animate-spin text-blue-600 w-6 h-6 mr-2" />
                <p className="text-gray-600">Loading billing details...</p>
            </div>
        );

    if (error)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-gray-700 font-medium">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                >
                    Go Back
                </button>
            </div>
        );

    if (!billing)
        return (
            <div className="flex flex-col justify-center items-center min-h-screen text-gray-500">
                <p>No billing data found.</p>
            </div>
        );

    const { unit, property, meter_readings } = billing;

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 py-10">
            <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-gray-100 relative">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
                >
                    <FaArrowLeft className="w-3 h-3" />
                    Back
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Billing Payment
                </h1>

                {/* Property Info */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                        <FaBuilding className="w-4 h-4" />
                        <span>{property.property_name} unit {unit.unit_name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        {property.street}, {property.city}, {property.province}
                    </p>
                </div>

                {/* Billing Summary */}
                <div className="bg-gradient-to-r from-blue-600/90 to-emerald-600/90 text-white rounded-xl p-4 shadow-inner mb-6">
                    <p className="text-sm font-medium">
                        Billing Period: {formatDate(billing.billing_period)}
                    </p>
                    <p className="text-sm font-medium">
                        Due Date: {dueDate ? formatDate(dueDate.toISOString()) : "N/A"}
                    </p>
                    <p className="text-lg font-semibold mt-2">
                        Total Due: {formatCurrency(billing.total_amount_due)}
                    </p>
                </div>

                {/* Meter Readings */}
                {meter_readings && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Meter Readings
                        </h3>
                        <div className="space-y-2 text-sm">
                            {meter_readings.water && (
                                <p className="flex items-center gap-2 text-gray-600">
                                    <FaWater className="text-blue-500 w-4 h-4" />
                                    Water: {meter_readings.water.previous} →{" "}
                                    {meter_readings.water.current}
                                </p>
                            )}
                            {meter_readings.electricity && (
                                <p className="flex items-center gap-2 text-gray-600">
                                    <FaBolt className="text-yellow-500 w-4 h-4" />
                                    Electricity: {meter_readings.electricity.previous} →{" "}
                                    {meter_readings.electricity.current}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="mb-4 text-center">
                    {billing.status === "paid" ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircleIcon className="w-8 h-8 text-green-500" />
                            <p className="text-green-700 font-medium">Already Paid</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                            <p className="text-amber-700 font-medium">Pending Payment</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => window.open(`/api/tenant/billing/${billing_id}`, "_blank")}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:from-emerald-700 hover:to-green-800 transition-all"
                    >
                        📄 Download Statement (PDF)
                    </button>


                    {billing.status !== "paid" && (
                        <button
                            onClick={handleMayaPayment}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FaCreditCard className="w-4 h-4" />
                                    Pay Now via Maya
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
