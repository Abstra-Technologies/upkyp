"use client";

import {
    Rocket,
    ArrowRight,
    CheckCircle,
} from "lucide-react";
import useSWR from "swr";
import axios from "axios";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LandlordBetaBanner() {
    const { user } = useAuthStore();
    const router = useRouter();

    const statusKey = user?.user_id
        ? `/api/landlord/subscription/status?user_id=${user?.user_id}`
        : null;

    const { data, isLoading } = useSWR(statusKey, fetcher);

    const hasSubscription = data?.has_subscription;
    const isBetaActive = data?.plan_code === "BETA";
    const endDate = data?.end_date;

    const remainingDays = useMemo(() => {
        if (!endDate) return null;
        const today = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    }, [endDate]);

    const handleJoinBeta = () => {
        router.push("/landlord/beta-program/joinForm");
    };

    if (isLoading) return null;

    if (isBetaActive) {
        return (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-[10px] sm:text-xs font-medium">
                        <span className="font-semibold">Beta Active</span>
                        {remainingDays !== null && remainingDays > 0 && (
                            <span className="hidden sm:inline"> — {remainingDays}d left</span>
                        )}
                    </p>
                </div>
            </div>
        );
    }

    if (hasSubscription) {
        return null;
    }

    return (
        <div className="px-3 py-2">
            <div className="max-w-7xl mx-auto rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                            <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[11px] sm:text-xs font-bold truncate">
                                Join UpKyp Beta — 60 days free
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={handleJoinBeta}
                        className="shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-md bg-white text-gray-900 hover:bg-white/90 transition-all"
                    >
                        Join
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
