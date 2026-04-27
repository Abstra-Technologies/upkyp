"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const EVENT_COLORS: Record<string, string> = {
    "rent-due": "bg-red-500",
    "move-in": "bg-emerald-500",
    "inspection": "bg-amber-500",
    "maintenance": "bg-blue-500",
    "visit": "bg-purple-500",
};

export default function TodayCalendar({ landlordId }: { landlordId?: string }) {
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });

    const today = useMemo(() => new Date(), []);
    const isCurrentMonth =
        viewDate.year === today.getFullYear() && viewDate.month === today.getMonth();

    const { data: selectedDayEvents, isLoading: loadingSelected } = useSWR(
        landlordId ? `/api/landlord/calendar/events?landlord_id=${landlordId}&date=${selectedDate}` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 },
    );

    const { data: monthEvents, isLoading: loadingMonth } = useSWR(
        landlordId ? `/api/landlord/calendar/events/month?landlord_id=${landlordId}&year=${viewDate.year}&month=${viewDate.month + 1}` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 120_000 },
    );

    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewDate.year, viewDate.month, 1);
        const lastDay = new Date(viewDate.year, viewDate.month + 1, 0);
        const startOffset = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < startOffset; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [viewDate]);

    const eventDates = useMemo(() => {
        const map: Record<number, any[]> = {};
        if (monthEvents?.events) {
            for (const ev of monthEvents.events) {
                const day = new Date(ev.date).getDate();
                if (!map[day]) map[day] = [];
                map[day].push(ev);
            }
        }
        return map;
    }, [monthEvents]);

    const upcomingEvents = useMemo(() => {
        const visits = selectedDayEvents?.propertyVisits || [];
        const maintenance = selectedDayEvents?.maintenanceRequests || [];
        return [
            ...visits.map((v: any) => ({
                type: "visit",
                label: v.property_name ? `${v.property_name} — ${v.unit_name}` : "Property Visit",
                date: v.visit_date,
            })),
            ...maintenance.map((m: any) => ({
                type: "maintenance",
                label: `${m.unit_name} — ${m.subject}`,
                date: m.scheduled_date,
            })),
        ];
    }, [selectedDayEvents]);

    const prevMonth = () =>
        setViewDate((p) =>
            p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 },
        );
    const nextMonth = () =>
        setViewDate((p) =>
            p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 },
        );

    const handleDayClick = (day: number) => {
        const key = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(key);
    };

    const selectedDayNum = parseInt(selectedDate.split("-")[2], 10);
    const selectedMonth = parseInt(selectedDate.split("-")[1], 10) - 1;
    const selectedYear = parseInt(selectedDate.split("-")[0], 10);
    const isSelectedInCurrentView = selectedYear === viewDate.year && selectedMonth === viewDate.month;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Schedule</h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="text-xs font-semibold text-gray-700 w-24 text-center">
                        {MONTHS[viewDate.month]}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-3">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((day, i) => {
                        if (day === null) return <div key={`e-${i}`} />;
                        const isToday = isCurrentMonth && day === today.getDate();
                        const isSelected = isSelectedInCurrentView && day === selectedDayNum;
                        const hasEvents = eventDates[day]?.length > 0;
                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    relative flex items-center justify-center text-xs py-1.5 rounded-lg transition-colors
                                    ${isSelected ? "bg-emerald-600 text-white font-bold" : ""}
                                    ${!isSelected && isToday ? "bg-emerald-100 text-emerald-700 font-semibold" : ""}
                                    ${!isSelected && !isToday ? "text-gray-700 hover:bg-gray-100" : ""}
                                `}
                            >
                                {day}
                                {hasEvents && !isSelected && (
                                    <span className="absolute bottom-0.5 w-1 h-1 bg-emerald-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Label */}
            <div className="mb-2 px-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Events List */}
            <div className="border-t border-gray-100 pt-3 flex-1 flex flex-col">
                {loadingSelected ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-8 bg-gray-100 rounded-lg" />
                        <div className="h-8 bg-gray-100 rounded-lg" />
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No events this day</p>
                ) : (
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {upcomingEvents.map((ev, idx) => {
                            const color = EVENT_COLORS[ev.type] || "bg-gray-500";
                            return (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 truncate">{ev.label}</p>
                                        {ev.date && (
                                            <p className="text-[10px] text-gray-400">{ev.date}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-100">
                    {Object.entries(EVENT_COLORS).map(([key, color]) => (
                        <div key={key} className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                            <span className="text-[9px] text-gray-400 capitalize">
                                {key.replace("-", " ")}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
