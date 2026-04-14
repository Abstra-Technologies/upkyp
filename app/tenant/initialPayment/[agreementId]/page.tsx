"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

import {
    ArrowLeftIcon,
    PhotoIcon,
    CheckCircleIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";

import LoadingScreen from "@/components/loadingScreen";

export default function InitialPaymentPage() {
    const router = useRouter();
    const params = useParams();

    const agreementId = params?.agreementId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const { user } = useAuthStore();

    /* -----------------------------------------
       FETCH PAYMENT DETAILS
    ----------------------------------------- */
    const fetchData = useCallback(async () => {
        if (!agreementId) return;

        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(
                `/api/tenant/initialPayment/details?agreement_id=${agreementId}`
            );

            setPaymentData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load details");
        } finally {
            setLoading(false);
        }
    }, [agreementId]);

    useEffect(() => {
        if (!agreementId) return;
        fetchData();
    }, [fetchData, agreementId]);

    const goBack = () => router.back();

    /* -----------------------------------------
       UPLOAD PROOF
    ----------------------------------------- */
    const handleUploadProof = async (type: "advance" | "deposit") => {
        if (!agreementId) return;

        const { value: file } = await Swal.fire({
            title: `Upload Proof of ${
                type === "advance" ? "Advance Payment" : "Security Deposit"
            }`,
            input: "file",
            inputAttributes: { accept: "image/*,application/pdf" },
            showCancelButton: true,
        });

        if (!file) return;

        setIsUploading(true);
        Swal.fire({ title: "Uploading...", didOpen: () => Swal.showLoading() });

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agreement_id", agreementId);
            formData.append("payment_type", type);

            await axios.post("/api/tenant/initialPayment/uploadProof", formData);

            Swal.close();
            Swal.fire("Success", "Proof uploaded successfully!", "success");
            await fetchData();
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.message || "Upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    /* -----------------------------------------
       PAY VIA XENDIT
    ----------------------------------------- */
    const handlePay = async (type: "advance" | "deposit", amount: number) => {
        if (!agreementId || !user) return;

        try {
            setIsRedirecting(true);

            const res = await axios.post(
                "/api/tenant/initialPayment",
                {
                    agreement_id: agreementId,
                    payment_type: type,
                    amount,
                    payer: {
                        first_name: user.firstName,
                        last_name: user.lastName,
                        email: user.email,
                    },
                    redirect_url: {
                        success: `${window.location.origin}/pages/payment/initialPaymentSuccess`,
                        failure: `${window.location.origin}/pages/payment/initialPaymentFailed`,
                    },
                }
            );

            if (res.data?.checkout_url) {
                window.location.href = res.data.checkout_url;
            } else {
                Swal.fire("Error", "No checkout URL returned.", "error");
            }
        } catch (err: any) {
            Swal.fire("Payment Error", "Payment failed.", "error");
        } finally {
            setIsRedirecting(false);
        }
    };

    /* -----------------------------------------
       GUARDS
    ----------------------------------------- */
    if (!agreementId) {
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                Invalid or missing agreement ID.
            </div>
        );
    }

    if (loading) return <LoadingScreen message="Loading payment details..." />;

    if (error)
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );

    /* -----------------------------------------
       DATA NORMALIZATION
    ----------------------------------------- */
    const data = paymentData ?? {};
    const advance = data.advance_payment ?? null;
    const deposit = data.security_deposit ?? null;

    const hasAdvance = !!advance && advance.status !== "paid";
    const hasDeposit = !!deposit && deposit.status !== "paid";

    const firstPending = hasAdvance ? "advance" : hasDeposit ? "deposit" : null;

    const advanceAmount = Number(advance?.amount || 0);
    const depositAmount = Number(deposit?.amount || 0);

    /* -----------------------------------------
       RENDER
    ----------------------------------------- */
    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={goBack}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold truncate">
                    Initial Payment — Agreement #{agreementId}
                </h1>
            </div>

            {/* SUMMARY */}
            <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">
                <h2 className="font-semibold mb-3">Initial Payment Overview</h2>

                {hasAdvance && (
                    <div className="flex justify-between">
                        <span>Advance Payment</span>
                        <span className="font-bold">₱{advanceAmount.toLocaleString()}</span>
                    </div>
                )}

                {hasDeposit && (
                    <div className="flex justify-between">
                        <span>Security Deposit</span>
                        <span className="font-bold">₱{depositAmount.toLocaleString()}</span>
                    </div>
                )}

                {!hasAdvance && !hasDeposit && (
                    <div className="text-emerald-600 font-semibold text-center mt-3">
                        <CheckCircleIcon className="w-6 h-6 mx-auto mb-2" />
                        Your initial payments are fully settled.
                        <button
                            onClick={() => router.push("/pages/tenant/my-unit")}
                            className="mt-4 w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold"
                        >
                            Back to My Units
                        </button>
                    </div>
                )}
            </div>

            {/* FIRST PENDING PAYMENT ONLY */}
            {firstPending === "advance" && (
                <div className="space-y-3">
                    <button
                        onClick={() => handlePay("advance", advanceAmount)}
                        disabled={isRedirecting || isUploading}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold"
                    >
                        <CreditCardIcon className="inline w-5 h-5 mr-2" />
                        Pay Advance via Xendit
                    </button>

                    <button
                        onClick={() => handleUploadProof("advance")}
                        disabled={isRedirecting || isUploading}
                        className="w-full py-3 bg-gray-100 rounded-lg font-semibold"
                    >
                        <PhotoIcon className="inline w-5 h-5 mr-2" />
                        Upload Proof of Advance Payment
                    </button>
                </div>
            )}

            {firstPending === "deposit" && (
                <div className="space-y-3">
                    <button
                        onClick={() => handlePay("deposit", depositAmount)}
                        disabled={isRedirecting || isUploading}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold"
                    >
                        <CreditCardIcon className="inline w-5 h-5 mr-2" />
                        Pay Security Deposit via Xendit
                    </button>

                    <button
                        onClick={() => handleUploadProof("deposit")}
                        disabled={isRedirecting || isUploading}
                        className="w-full py-3 bg-gray-100 rounded-lg font-semibold"
                    >
                        <PhotoIcon className="inline w-5 h-5 mr-2" />
                        Upload Proof of Security Deposit
                    </button>
                </div>
            )}
        </div>
    );
}
