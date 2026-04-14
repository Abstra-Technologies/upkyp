"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { ArrowLeft, Send, AlertTriangle, CreditCard } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function ReviewPayoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paymentIds = searchParams.get("payment_ids");
    const ids = paymentIds ? paymentIds.split(",").filter(Boolean) : [];

    const { data, error, isLoading } = useSWR(
        ids.length
            ? `/api/systemadmin/payouts/review?payment_ids=${ids.join(",")}`
            : null,
        fetcher
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const landlords = data?.landlords || [];

    // ✅ CORRECT BLOCK CONDITION
    const hasInvalidChannel = landlords.some(
        (l: any) =>
            !l.payout_channel || l.payout_channel.is_available === false
    );

    const handleConfirmDisbursement = async () => {
        if (!ids.length || hasInvalidChannel) return;

        const confirmed = confirm(
            "Are you sure you want to disburse these payments? This action cannot be undone."
        );
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            await axios.post("/api/systemadmin/payouts/disburse", {
                payment_ids: ids,
            });

            alert("Disbursement initiated successfully.");
            router.push("/pages/system_admin/payouts/payments_list");
        } catch (err) {
            console.error(err);
            alert("Failed to initiate disbursement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <h1 className="text-2xl font-bold text-gray-800">
                    Review Payout Disbursement
                </h1>
            </div>

            {/* STATES */}
            {isLoading && (
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    Loading payout details…
                </div>
            )}

            {error && (
                <div className="bg-white p-6 rounded-xl shadow text-center text-red-500">
                    Failed to load payout details.
                </div>
            )}

            {!isLoading && !error && landlords.length === 0 && (
                <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
                    No valid payments found.
                </div>
            )}

            {/* LANDLORD GROUPS */}
            {!isLoading &&
                landlords.map((l: any) => {
                    const totalNet = l.payments.reduce(
                        (sum: number, p: any) => sum + Number(p.net_amount ?? 0),
                        0
                    );

                    const channel = l.payout_channel;

                    return (
                        <div
                            key={l.landlord_id}
                            className="bg-white rounded-xl shadow border mb-6"
                        >
                            <div className="p-4 border-b bg-gray-50 space-y-1">
                                <h2 className="font-semibold text-gray-800">
                                    {l.landlord_name}
                                </h2>

                                {channel ? (
                                    <>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="font-medium">
                        {channel.bank_name}
                      </span>

                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    channel.is_available
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                        {channel.channel_type}
                                                {!channel.is_available && " (Disabled)"}
                      </span>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            Account: {l.account_name} • {l.account_number}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-red-600 font-semibold">
                                        ⚠ No payout account configured
                                    </p>
                                )}
                            </div>

                            {/* PAYMENTS */}
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="py-2 text-left">Payment ID</th>
                                        <th className="py-2 text-left">Type</th>
                                        <th className="py-2 text-right">Net Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {l.payments.map((p: any) => (
                                        <tr
                                            key={p.payment_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="py-2">{p.payment_id}</td>
                                            <td className="py-2 capitalize">
                                                {p.payment_type}
                                            </td>
                                            <td className="py-2 text-right font-semibold text-emerald-700">
                                                ₱{Number(p.net_amount ?? 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                <div className="flex justify-end mt-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Total Net Payout:{" "}
                      <span className="text-lg text-emerald-600">
                      ₱{totalNet.toLocaleString()}
                    </span>
                  </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

            {/* BLOCKING WARNING */}
            {!isLoading && hasInvalidChannel && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">
                        One or more landlords do not have an active payout channel.
                        Disbursement is blocked until this is resolved.
                    </p>
                </div>
            )}

            {/* NORMAL WARNING */}
            {!isLoading && landlords.length > 0 && !hasInvalidChannel && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                        Please review all payout details carefully. Once confirmed,
                        payouts will be sent using each landlord’s active payout channel.
                    </p>
                </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                    Cancel
                </button>

                <button
                    onClick={handleConfirmDisbursement}
                    disabled={
                        isSubmitting || landlords.length === 0 || hasInvalidChannel
                    }
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Processing…" : "Confirm Disbursement"}
                </button>
            </div>
        </div>
    );
}

/* ===============================
   Page with Suspense
================================ */
export default function ReviewPayoutPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white p-6 rounded-xl shadow text-center">
                        Loading payout details…
                    </div>
                </div>
            }
        >
            <ReviewPayoutContent />
        </Suspense>
    );
}
