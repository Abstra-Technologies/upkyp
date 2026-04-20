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
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-3 text-sm text-gray-600">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                    No subscription subscribed yet.
                </p>
                <Link
                    href="/landlord/subsciption_plan/pricing"
                    className="inline-block bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold py-2.5 px-5 rounded-lg"
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
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 mt-0.5" />
                    <div>
                        <p className="font-medium">Something went wrong</p>
                        <p className="text-sm mt-1">
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {subscription.plan_name}
                        </h3>
                    </div>

                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            isCancelled
                                ? "bg-amber-100 text-amber-700"
                                : subscription.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoCard
                        icon={<Calendar className="w-4 h-4 text-blue-600" />}
                        label="Start Date"
                        value={subscription.start_date}
                    />
                    <InfoCard
                        icon={<Clock className="w-4 h-4 text-emerald-600" />}
                        label="End Date"
                        value={subscription.end_date}
                        suffix=" at 11:59 PM"
                    />
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                        Payment Status
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                        {subscription.payment_status}
                    </span>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-900">
                                    Subscription Cancelled
                                </p>
                                <p className="text-sm text-amber-800 mt-1">
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
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <p className="text-sm text-emerald-900">
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
                    <div className="space-y-3">
                        <Link
                            href="/landlord/subsciption_plan/pricing"
                            className="block bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold py-3 px-4 rounded-lg text-center"
                        >
                            {isCancelled ? "Reactivate / Upgrade Plan" : "Upgrade Plan"}
                        </Link>

                        {!isCancelled && (
                            <button
                                onClick={handleCancelSubscription}
                                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <XCircle className="w-4 h-4" />
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
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            {icon}
            <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                    {label}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
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
