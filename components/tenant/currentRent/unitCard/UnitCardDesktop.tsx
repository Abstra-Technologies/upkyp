"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import {
    MapPinIcon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";

import { Unit } from "@/types/units";
import { formatDate } from "@/utils/formatter/formatters";

function getDaysUntilMoveIn(moveInDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const moveDate = new Date(moveInDate);
    moveDate.setHours(0, 0, 0, 0);
    const diffTime = moveDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isMoveInDay(moveInDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const moveDate = new Date(moveInDate);
    moveDate.setHours(0, 0, 0, 0);
    return today.getTime() === moveDate.getTime();
}

export default function UnitCardDesktop({
                                              unit,
                                              onContactLandlord,
                                              onAccessPortal,
                                              onRefresh,
                                          }: {
    unit: Unit;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
    onRefresh?: () => void;
}) {
    const [loadingDate, setLoadingDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");

    const showDatePicker =
        unit.move_in_checklist === 1 && !unit.move_in_date;

    const canAccessPortal = !!unit.move_in_date;

    const daysUntilMoveIn = canAccessPortal
        ? getDaysUntilMoveIn(unit.move_in_date!)
        : null;

    const isToday = canAccessPortal
        ? isMoveInDay(unit.move_in_date!)
        : false;

    const showCountdown = canAccessPortal && daysUntilMoveIn !== null && daysUntilMoveIn > 0;

    const handleSetMoveInDate = async () => {
        if (!selectedDate) {
            Swal.fire("Select Date", "Please select a move-in date", "warning");
            return;
        }

        setLoadingDate(true);

        try {
            const res = await axios.put("/api/tenant/activeRent/updateMoveInDate", {
                agreement_id: unit.agreement_id,
                move_in_date: selectedDate,
            });

            if (res.status === 200) {
                await Swal.fire({
                    icon: "success",
                    title: "Move-in Date Set",
                    text: `Your move-in date has been set to ${formatDate(selectedDate)}`,
                    confirmButtonText: "OK",
                    confirmButtonColor: "#10B981",
                });

                if (onRefresh) {
                    onRefresh();
                }
            }
        } catch (error: any) {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.error || "Failed to set move-in date",
            });
        } finally {
            setLoadingDate(false);
        }
    };

    return (
        <article className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* IMAGE */}

            <div className="relative h-48 overflow-hidden bg-gray-100">
                <Image
                    src={
                        unit.unit_photos?.[0] ||
                        process.env.NEXT_PUBLIC_UNIT_PLACEHOLDER!
                    }
                    fill
                    className="object-cover"
                    alt={`Unit ${unit.unit_name}`}
                />

                {/* MOVE-IN DATE BANNER (SET) */}
                {canAccessPortal && (
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white px-4 py-2.5 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                                <CalendarIcon className="w-4 h-4" />
                                Move-in: {formatDate(unit.move_in_date)}
                            </span>
                            <span className="font-semibold">
                                {daysUntilMoveIn !== null && daysUntilMoveIn > 0
                                    ? `${daysUntilMoveIn} day${daysUntilMoveIn === 1 ? "" : "s"}`
                                    : daysUntilMoveIn === 0
                                        ? "Today!"
                                        : "Ready"}
                            </span>
                        </div>
                    </div>
                )}

                {/* COUNTDOWN TIMER OVERLAY */}
                {showCountdown && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-center min-w-[80px]">
                        <p className="text-xs font-medium text-blue-600">Days Left</p>
                        <p className="text-3xl font-bold text-blue-700 leading-none">{daysUntilMoveIn}</p>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-3">
                <div>
                    <h2 className="font-bold text-lg text-gray-900">
                        Unit {unit.unit_name}
                    </h2>
                    <p className="text-sm font-medium text-gray-700">
                        {unit.property_name}
                    </p>

                    <p className='text-sm text-gray-60'>Agrrement id: {unit?.agreement_id}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
                        {unit.city}, {unit.province}
                    </span>

                    <span className="text-gray-300">•</span>

                    <span className="flex items-center gap-1">
                        <HomeIcon className="w-3.5 h-3.5 text-emerald-600" />
                        {unit.unit_size} sqm
                    </span>
                </div>

                {/* MOVE-IN DATE PICKER */}
                {showDatePicker && (
                    <div className="border-t border-gray-100 pt-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                            <CalendarIcon className="w-4 h-4 inline mr-1" />
                            Set Move-in Date to Access Portal
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleSetMoveInDate}
                                disabled={loadingDate || !selectedDate}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-blue-700"
                            >
                                {loadingDate ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}

                {/* MOVE-IN DAY MESSAGE */}
                {isToday && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <p className="text-sm font-bold text-emerald-700">
                            Welcome Home! It's Move-in Day!
                        </p>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="space-y-2 pt-2">
                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        disabled={!canAccessPortal}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                        font-semibold text-sm
                        ${
                            canAccessPortal
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:opacity-95"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        {canAccessPortal
                            ? daysUntilMoveIn !== null && daysUntilMoveIn > 0
                                ? `Access Portal (${daysUntilMoveIn} days until move-in)`
                                : "Access Rental Portal"
                            : "Set Move-in Date First"}
                    </button>

                    <button
                        onClick={onContactLandlord}
                        className="w-full flex items-center justify-center gap-2 py-2.5
                        bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg
                        font-semibold text-sm"
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Message Landlord
                    </button>
                </div>
            </div>
        </article>
    );
}