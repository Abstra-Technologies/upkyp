"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { AlertCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { GRADIENT_PRIMARY } from "@/constant/design-constants";

const fetcher = async (url: string) => {
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
        if (
            axios.isAxiosError(error) &&
            (error.response?.status === 400 || error.response?.status === 404)
        ) {
            return { status: "incomplete" };
        }
        throw error;
    }
};

type ProfileStatus = "incomplete" | "pending" | "rejected" | "verified";

interface Props {
    landlord_id: string;
}

export default function LandlordProfileStatus({ landlord_id }: Props) {
    const router = useRouter();

    const { data, isLoading } = useSWR<{ status?: ProfileStatus }>(
        landlord_id ? `/api/landlord/${landlord_id}/profileStatus` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const status: ProfileStatus = data?.status ?? "incomplete";

    /* ================= LOADING ================= */
    if (isLoading) {
        return (
            <div className="px-3 py-2 rounded-lg bg-gray-100 animate-pulse h-10" />
        );
    }

    /* ================= VERIFIED ================= */
    if (status === "verified") return null;

    /* ================= CONFIG ================= */
    const configs = {
        incomplete: {
            bg: "bg-orange-50 border-orange-200",
            icon: AlertCircle,
            iconColor: "text-orange-600",
            text: "Verification required to unlock all features.",
            action: "Start",
        },
        pending: {
            bg: "bg-blue-50 border-blue-200",
            icon: Clock,
            iconColor: "text-blue-600",
            text: "Landlord Verification under review.",
        },
        rejected: {
            bg: "bg-red-50 border-red-200",
            icon: XCircle,
            iconColor: "text-red-600",
            text: "Verification rejected. Please resubmit.",
            action: "Fix",
        },
    };

    const cfg = configs[status];
    const Icon = cfg.icon;

    return (
        <div
            className={`flex items-center gap-3
    px-4 py-2 rounded-md
    ${cfg.bg}
    shadow-sm`}
        >
            {/* Status Badge */}
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center
      bg-white/70`}
            >
                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
            </div>

            {/* Message */}
            <p className="text-xs sm:text-sm text-gray-700 truncate flex-1">
                {cfg.text}
            </p>

            {/* Action */}
            {cfg.action && (
                <button
                    onClick={() => router.push("/landlord/verification")}
                    className="inline-flex items-center gap-1
        text-[11px] sm:text-xs font-semibold
        px-3 py-1.5 rounded-md
        bg-white/80 text-gray-900
        hover:bg-white
        transition whitespace-nowrap"
                >
                    {cfg.action}
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );

}
