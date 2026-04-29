"use client";

import Link from "next/link";
import useSWR, { mutate } from "swr";
import axios from "axios";
import {
    Crown,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
} from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import Swal from "sweetalert2";
import { logEvent } from "@/utils/gtag";

const fetcher = (url: string) =>
    axios.get(url).then(res => res.data);

export default function LandlordSubscriptionPlanComponent({ landlord_id }) {
    const { user } = useAuthStore();

    const {
        data: subscription,
        error,
        isLoading,
    } = useSWR(
        landlord_id
            ? `/api/landlord/subscription/active/${landlord_id}`
            : null,
        fetcher
    );

    /* ===============================
       Derived State
    =============================== */
    const isCancelled =
        subscription?.payment_status === "cancelled" &&
        subscription?.is_active === 1;

    /* ===============================
       Cancel Subscription
    =============================== */
    const handleCancelSubscription = async () => {
        const result = await Swal.fire({
            title: "Cancel Subscription?",
            text: "Your subscription will remain active until the end of the billing period.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel",
            cancelButtonText: "Keep subscription",
            confirmButtonColor: "#d33",
        });

        if (!result.isConfirmed) return;

        try {
            await axios.post("/api/landlord/subscription/cancel", {
                landlord_id,
            });

            logEvent(
                "Subscription Cancelled",
                "Subscription",
                subscription?.plan_name || "Unknown",
                1
            );

            Swal.fire(
                "Cancelled",
                "Your subscription will remain active until the end of the billing period.",
                "success"
            );

            mutate(`/api/landlord/subscription/active/${landlord_id}`);
        } catch {
            Swal.fire("Error", "Failed to cancel subscription.", "error");
        }
    };

    /* ===============================
       Loading State
    =============================== */
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border border-gray-300 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
                <p className="mt-2 text-xs text-gray-500">
                    Loading your subscription…
                </p>
            </div>
        );
    }

    /* ===============================
       NO SUBSCRIPTION (404)
    =============================== */
    if (error?.response?.status === 404) {
        return (
            <div className="bg-white border border-gray-300 rounded-lg p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.05)]">
                <p className="text-xs text-gray-500 mb-3">
                    No subscription subscribed yet.
                </p>
                <Link
                    href="/public/pricing"
                    className="inline-block bg-blue-600 text-white text-xs font-semibold py-2 px-4 rounded-md hover:bg-blue-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all"
                >
                    Subscribe Now
                </Link>
            </div>
        );
    }

    /* ===============================
       REAL ERROR
    =============================== */
    if (error) {
        return (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium">Something went wrong</p>
                        <p className="text-xs mt-0.5 text-red-600">
                            Unable to load subscription details.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ===============================
       Active Subscription UI
    =============================== */
    return (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.05)] hover:border-gray-400 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.08)] transition-all">
            <div className="p-3 space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                            <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                            {subscription.plan_name}
                        </h3>
                    </div>

                    <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                            isCancelled
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : subscription.is_active
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-red-50 text-red-700 border-red-300"
                        }`}
                    >
                        {isCancelled
                            ? "Cancels Soon"
                            : subscription.is_active
                                ? "Active"
                                : "Expired"}
                    </span>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoCard
                        icon={<Calendar className="w-3.5 h-3.5 text-blue-600" />}
                        label="Start Date"
                        value={subscription.start_date}
                    />
                    <InfoCard
                        icon={<Clock className="w-3.5 h-3.5 text-emerald-600" />}
                        label="End Date"
                        value={subscription.end_date}
                        suffix=" at 11:59 PM"
                    />
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <span className="text-xs font-medium text-gray-600">
                        Payment Status
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 border border-gray-300">
                        {subscription.payment_status}
                    </span>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800">
                                    Subscription Cancelled
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Your subscription remains active until{" "}
                                    <strong>
                                        {new Date(subscription.end_date).toLocaleDateString(
                                            "en-US",
                                            { year: "numeric", month: "long", day: "numeric" }
                                        )}
                                    </strong>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trial Banner */}
                {subscription.is_trial === 1 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                            <p className="text-xs text-emerald-800">
                                Free trial until{" "}
                                <strong>
                                    {new Date(subscription.end_date).toLocaleDateString()}
                                </strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {subscription.is_active && subscription.is_trial === 0 && (
                    <div className="space-y-2">
                        <Link
                            href="/public/pricing"
                            className="block bg-blue-600 text-white text-xs font-semibold py-2.5 px-4 rounded-md text-center hover:bg-blue-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all"
                        >
                            {isCancelled ? "Reactivate / Upgrade Plan" : "Upgrade Plan"}
                        </Link>

                        {!isCancelled && (
                            <button
                                onClick={handleCancelSubscription}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-md border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel Subscription
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ===============================
   Info Card
=============================== */
function InfoCard({ icon, label, value, suffix = "" }) {
    return (
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-gray-400 transition-all">
            {icon}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                    {label}
                </p>
                <p className="text-xs text-gray-900 mt-0.5">
                    {value
                        ? `${new Date(value).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}${suffix}`
                        : "N/A"}
                </p>
            </div>
        </div>
    );
}
