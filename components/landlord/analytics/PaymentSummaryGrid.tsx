"use client";

import Link from "next/link";
import { TrendingUp, ArrowDownRight, Clock } from "lucide-react";

import { formatCurrency } from "@/utils/formatter/formatters";
import { usePaymentSummary } from "@/hooks/analytics/landlord/usePaymentSummary";

interface Props {
    landlord_id: string;
}

export default function PaymentSummaryGrid({ landlord_id }: Props) {
    const { summary, isLoading } = usePaymentSummary(landlord_id);

    /* ===============================
       Loading State
    ================================ */
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    /* ===============================
       Card Config
    ================================ */
    const cards = [
        {
            title: "Total Rental Collected (YTD)",
            value: formatCurrency(summary.totalCollected),
            icon: TrendingUp,
            bg: "bg-blue-50",
            border: "border-blue-200",
            iconColor: "text-blue-600",
            valueColor: "text-blue-700",
        },
        {
            title: "Total Disbursed Payments",
            value: formatCurrency(summary.totalDisbursed),
            icon: ArrowDownRight,
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            iconColor: "text-emerald-600",
            valueColor: "text-emerald-700",
        },
        {
            title: "Pending Payouts",
            value: formatCurrency(summary.pendingPayouts),
            icon: Clock,
            bg: "bg-amber-50",
            border: "border-amber-200",
            iconColor: "text-amber-600",
            valueColor: "text-amber-700",
            link: "/landlord/payouts",
            helper: "View payout schedule",
        },
    ];

    /* ===============================
       Render
    ================================ */
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {cards.map((card) => {
                const CardBody = (
                    <div
                        className={`relative ${card.bg}
    aspect-square sm:aspect-auto
    rounded-lg sm:rounded-xl
    border ${card.border}
    p-3 sm:p-4
    min-w-0
    flex items-center justify-center sm:block
    ${card.link ? "cursor-pointer group hover:shadow-md transition-all" : ""}`}
                    >
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">

                            {/* Icon */}
                            <card.icon
                                className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${card.iconColor}`}
                            />

                            {/* Value */}
                            <span
                                className={`text-sm sm:text-2xl font-bold ${card.valueColor}
            truncate leading-tight`}
                            >
            {card.value}
        </span>

                            {/* Title */}
                            <p
                                className={`text-[10px] sm:text-sm ${card.iconColor}
            leading-tight mt-1 line-clamp-2`}
                            >
                                {card.title}
                            </p>
                        </div>

                        {card.link && (
                            <span
                                className="hidden sm:block absolute bottom-3 right-4
            text-xs font-medium text-amber-700
            opacity-0 group-hover:opacity-100 transition-opacity"
                            >
            {card.helper}
        </span>
                        )}
                    </div>
                );

                return card.link ? (
                    <Link key={card.title} href={card.link}>
                        {CardBody}
                    </Link>
                ) : (
                    <div key={card.title}>{CardBody}</div>
                );
            })}
        </div>
    );
}
