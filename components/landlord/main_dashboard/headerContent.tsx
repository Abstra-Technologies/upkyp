"use client";

import Clock from "./Clock";
import PropertySearch from "./PropertySearch";
import {
    CARD_CONTAINER,
    GRADIENT_TEXT,
} from "@/constant/design-constants";

interface HeaderContentProps {
    greeting: string;
    displayName: string;
    landlordId: string;
}

export default function HeaderContent({
                                          greeting,
                                          displayName,
                                          landlordId,
                                      }: HeaderContentProps) {
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const weekday = today.toLocaleDateString("en-US", {
        weekday: "long",
    });

    return (
        <div className={`${CARD_CONTAINER} py-3 px-4 sm:py-4 sm:px-5`}>
            <div className="flex items-center justify-between gap-3">

                {/* LEFT: Greeting */}
                <div className="flex-1 min-w-0">

{/* Smaller but readable heading */}
                    <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl
                                   font-semibold leading-snug truncate">
                        <span className={GRADIENT_TEXT}>{greeting}</span>
                        <span className="text-gray-400">, </span>
                        <span className="text-gray-900">{displayName}</span>
                    </h1>

                    {/* Subtitle smaller on mobile */}
                    <p className="hidden sm:block text-[11px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">
                        Here's what's happening with your properties today
                    </p>

                    {/* Date for mobile */}
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 lg:hidden">
                        {weekday}, {formattedDate}
                    </p>

                    {/* Property Search */}
                    <div className="mt-3">
                        <PropertySearch landlordId={landlordId} />
                    </div>
                </div>

                {/* RIGHT: Time (desktop only) */}
                <div className="hidden lg:flex items-center">
                    <div
                        className="bg-gradient-to-br from-blue-50 via-emerald-50 to-cyan-50
                                   px-4 py-2 rounded-lg border border-blue-100"
                    >
                        <div className="flex flex-col items-end leading-tight">
                            <div className={`text-lg font-bold ${GRADIENT_TEXT}`}>
                                <Clock />
                            </div>
                            <div className="text-[11px] font-medium text-gray-600">
                                {weekday}
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {formattedDate}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}