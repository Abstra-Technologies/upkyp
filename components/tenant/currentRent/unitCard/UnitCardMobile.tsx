"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import {
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";

import { Unit } from "@/types/units";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

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

export default function UnitCardMobile({
                                           unit,
                                           onAccessPortal,
                                           onContactLandlord,
                                           onRefresh,
                                       }: {
    unit: Unit;
    onAccessPortal: (agreementId: string) => void;
    onContactLandlord: () => void;
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
        <article
            className="bg-white rounded-xl
            border-2 border-gray-200
            shadow-sm overflow-hidden
            hover:border-gray-300
            transition-colors"
        >
            {/* HEADER */}
            <div className="flex gap-3 p-3">
                {/* IMAGE */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                        src={
                            unit.unit_photos?.[0] ||
                            process.env.NEXT_PUBLIC_UNIT_PLACEHOLDER!
                        }
                        fill
                        className="object-cover"
                        alt={unit.unit_name}
                    />
                </div>

                {/* CORE INFO */}
                <div className="flex-1 min-w-0">
                    <div>
                        <h2 className="font-bold text-sm text-gray-900 truncate">
                            Unit {unit.unit_name}
                        </h2>
                        <p className="text-xs text-gray-600 truncate">
                            {unit.property_name}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-700 text-sm">
                            {formatCurrency(unit.rent_amount)}
                        </span>
                        <span className="text-xs text-gray-500">/mo</span>
                    </div>
                </div>
            </div>

            {/* MOVE-IN DATE PICKER */}
            {showDatePicker && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        Set Move-in Date
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
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                        >
                            {loadingDate ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {/* DAYS UNTIL MOVE-IN (ONLY ON MOVE-IN DAY) */}
            {isToday && (
                <div className="px-3 pb-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <p className="text-sm font-bold text-emerald-700">
                            Welcome Home! It's Move-in Day!
                        </p>
                    </div>
                </div>
            )}

            {/* COUNTDOWN TIMER */}
            {showCountdown && (
                <div className="px-3 pb-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-medium">Days Until Move-in</p>
                        <p className="text-2xl font-bold text-blue-700">{daysUntilMoveIn}</p>
                    </div>
                </div>
            )}

            {/* ACTIONS */}
            <div className="px-3 pb-3 space-y-2">
                {/* Access Portal */}
                <button
                    onClick={() => onAccessPortal(unit.agreement_id)}
                    disabled={!canAccessPortal}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                    text-sm font-semibold
                    ${
                        canAccessPortal
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    {canAccessPortal
                        ? daysUntilMoveIn !== null && daysUntilMoveIn > 0
                            ? `Access Portal (${daysUntilMoveIn}d)`
                            : "Access Portal"
                        : "Access Portal"}
                </button>

                {/* Message Landlord */}
                <button
                    onClick={onContactLandlord}
                    className="w-full flex items-center justify-center gap-2 py-2
                    bg-gray-100 hover:bg-gray-200
                    text-gray-700 rounded-lg text-sm font-semibold"
                >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Message Landlord
                </button>
            </div>
        </article>
    );
}