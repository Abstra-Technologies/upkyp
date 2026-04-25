"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import {
    CARD_CONTAINER,
    CARD_HOVER,
    SECTION_HEADER,
    GRADIENT_DOT,
    SECTION_TITLE,
    GRADIENT_TEXT,
    EMPTY_STATE_ICON,
} from "@/constant/design-constants";

export default function LandlordCalendar({ landlordId }) {
    const fetcher = (url: string) => axios.get(url).then((res) => res.data);

    /* ===============================
       DATE STATE (LOCAL SAFE)
    =============================== */
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const dateKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    const { data, isLoading } = useSWR(
        landlordId
            ? `/api/landlord/calendar/events?landlord_id=${landlordId}&date=${dateKey}`
            : null,
        fetcher
    );

    /* ===============================
       DATE DISPLAY
    =============================== */
    const monthYear = currentDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    const dayNumber = currentDate.toLocaleString("en-US", {
        day: "2-digit",
    });

    const weekday = currentDate.toLocaleString("en-US", {
        weekday: "long",
    });

    /* ===============================
       NAVIGATION
    =============================== */
    const changeDay = (offset: number) => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + offset);
            return next;
        });
    };

    /* ===============================
       EVENTS
    =============================== */
    const visits = data?.propertyVisits || [];
    const maintenance = data?.maintenanceRequests || [];

    const formatTime = (time?: string) => {
        if (!time) return "";
        const [h, m] = time.split(":");
        const hour = Number(h);
        const suffix = hour >= 12 ? "PM" : "AM";
        return `${hour % 12 || 12}:${m} ${suffix}`;
    };

    const events = [
        ...visits.map((v) => ({
            type: "visit",
            title: `${v.property_name} — ${v.unit_name}`,
            time: formatTime(v.visit_time),
            status: v.status,
        })),
        ...maintenance.map((m) => ({
            type: "maintenance",
            title: `${m.unit_name} — ${m.subject}`,
            status: m.status,
        })),
    ];

    return (
        <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col hover:bg-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
            {/* HEADER */}
            <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">Events</h2>
            </div>

            {/* DATE NAVIGATION */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => changeDay(-1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-blue-50 transition"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-600">{monthYear}</p>
                    <p className={`text-4xl md:text-5xl font-bold ${GRADIENT_TEXT}`}>
                        {dayNumber}
                    </p>
                    <p className="text-xs text-gray-500">{weekday}</p>
                </div>

                <button
                    onClick={() => changeDay(1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-blue-50 transition"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* EVENTS */}
            <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Events</h3>
                </div>

                {/* LOADING */}
                {isLoading && (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-16 bg-gray-100 rounded-lg"></div>
                        <div className="h-16 bg-gray-100 rounded-lg"></div>
                    </div>
                )}

                {/* EMPTY */}
                {!isLoading && events.length === 0 && (
                    <div className="text-center py-6">
                        <div className={EMPTY_STATE_ICON}>
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600">
                            No events scheduled for this day
                        </p>
                    </div>
                )}

                {/* EVENTS LIST */}
                {!isLoading && events.length > 0 && (
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {events.map((ev, index) => (
                            <div
                                key={index}
                                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all"
                            >
                                <div className="flex items-start gap-2 mb-1">
                                    <Clock className="w-3 h-3 text-gray-500 mt-0.5" />
                                    <span className="text-xs text-gray-500 uppercase font-medium">
                    {ev.type === "visit" ? "Property Visit" : "Maintenance"}
                  </span>
                                </div>

                                {/* TITLE */}
                                <p className="font-medium text-gray-900 text-sm mb-1 truncate">
                                    {ev.title}
                                </p>

                                {/* TIME (VISITS ONLY) */}
                                {ev.type === "visit" && ev.time && (
                                    <p className="text-xs text-gray-500 mb-1">{ev.time}</p>
                                )}

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
