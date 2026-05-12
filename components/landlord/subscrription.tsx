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
    const isActive = subscription.is_active;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-2.5 space-y-2.5">

                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded flex items-center justify-center shrink-0">
                            <Crown className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-900 truncate">
                            {subscription.plan_name}
                        </h3>
                    </div>

                    <span
                        className={`shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded border ${
                            isCancelled
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-red-50 text-red-700 border-red-300"
                        }`}
                    >
                        {isCancelled
                            ? "Cancels Soon"
                            : isActive
                                ? "Active"
                                : "Expired"}
                    </span>
                </div>

                {/* Start Date + Payment Status row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="text-[10px] text-gray-500">Started</span>
                        <span className="text-[10px] font-semibold text-gray-900 truncate">
                            {subscription.start_date
                                ? new Date(subscription.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "N/A"}
                        </span>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {subscription.payment_status}
                    </span>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-800">
                                Active until <strong>{new Date(subscription.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Trial Banner */}
                {subscription.is_trial === 1 && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-emerald-800">
                                Free trial until <strong>{new Date(subscription.end_date).toLocaleDateString()}</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {isActive && subscription.is_trial === 0 && (
                    <div className="flex gap-1.5 pt-1">
                        <Link
                            href="/public/pricing"
                            className="flex-1 text-center bg-blue-600 text-white text-[10px] font-semibold py-2 rounded-lg active:bg-blue-700 transition-all"
                        >
                            {isCancelled ? "Reactivate" : "Upgrade"}
                        </Link>
                        {!isCancelled && (
                            <button
                                onClick={handleCancelSubscription}
                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-2 rounded-lg border border-red-200 text-red-600 active:bg-red-50 transition-all"
                            >
                                <XCircle className="w-3 h-3" />
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
