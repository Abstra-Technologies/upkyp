"use client";

import Clock from "./Clock";
import PropertySearch from "./PropertySearch";
import {
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
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 md:py-2.5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                {/* TOP ROW: Greeting + Time */}
                <div className="flex items-center justify-between gap-4">
                    {/* LEFT: Greeting + Page Header */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">
                            <span className={GRADIENT_TEXT}>{greeting}</span>
                            <span className="text-gray-400">, </span>
                            <span className="text-gray-900">{displayName}</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            Portfolio Overview
                        </p>
                    </div>

                    {/* RIGHT: Time */}
                    <div className="flex flex-col items-end leading-tight shrink-0">
                        <div className={`text-xs sm:text-sm font-bold ${GRADIENT_TEXT}`}>
                            <Clock />
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500">
                            {weekday}
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW: Search Bar */}
                <div className="w-full md:flex-1 md:max-w-md">
                    <PropertySearch landlordId={landlordId} />
                </div>

            </div>
        </div>
    );
}