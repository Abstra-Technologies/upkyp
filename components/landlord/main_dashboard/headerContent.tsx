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
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5">
            <div className="flex items-center justify-between gap-4">

                {/* LEFT: Greeting + Page Header */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                        <span className={GRADIENT_TEXT}>{greeting}</span>
                        <span className="text-gray-400">, </span>
                        <span className="text-gray-900">{displayName}</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Portfolio Overview
                    </p>
                </div>

                {/* CENTER: Search Bar */}
                <div className="hidden sm:block flex-1 max-w-md">
                    <PropertySearch landlordId={landlordId} />
                </div>

                {/* RIGHT: Time */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end leading-tight">
                        <div className={`text-sm font-bold ${GRADIENT_TEXT}`}>
                            <Clock />
                        </div>
                        <div className="text-[10px] text-gray-500">
                            {weekday}
                        </div>
                    </div>
                    <div className="sm:hidden">
                        <PropertySearch landlordId={landlordId} />
                    </div>
                </div>

            </div>
        </div>
    );
}