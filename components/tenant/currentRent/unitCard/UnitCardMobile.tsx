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
    DocumentTextIcon,
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

    const needsSigning =
        unit.has_signature_records &&
        unit.leaseSignature !== "completed" &&
        unit.leaseSignature !== "active";

    const needsMoveInDate = showDatePicker;

    const noRequirements = !needsSigning && !needsMoveInDate;

    const canAccessPortal =
        noRequirements ||
        (!!unit.move_in_date && !needsSigning && !needsMoveInDate);

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
            border-2 border-gray-300
            shadow-sm overflow-hidden
            hover:border-gray-400
            transition-colors"
        >
            {/* HEADER */}
            <div className="flex gap-2 p-2">
                {/* IMAGE */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                        <h2 className="font-bold text-xs text-gray-900 truncate">
                            Unit {unit.unit_name}
                        </h2>
                        <p className="text-[10px] text-gray-600 truncate">
                            {unit.property_name}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                        <CurrencyDollarIcon className="w-3 h-3 text-blue-600" />
                        <span className="font-bold text-blue-700 text-xs">
                            {formatCurrency(unit.rent_amount)}
                        </span>
                        <span className="text-[10px] text-gray-500">/mo</span>
                    </div>
                </div>
            </div>

            {/* MOVE-IN DATE PICKER */}
            {showDatePicker && (
                <div className="px-2 pb-2 border-t border-gray-100 pt-2">
                    <label className="block text-[10px] font-semibold text-gray-700 mb-1.5">
                        <CalendarIcon className="w-3 h-3 inline mr-0.5" />
                        Set Move-in Date
                    </label>
                    <div className="flex gap-1.5">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleSetMoveInDate}
                            disabled={loadingDate || !selectedDate}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                        >
                            {loadingDate ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {/* DAYS UNTIL MOVE-IN (ONLY ON MOVE-IN DAY) */}
            {isToday && unit.move_in_date && (
                <div className="px-2 pb-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1.5 px-2 text-center">
                        <p className="text-xs font-bold text-emerald-700">
                            Welcome Home! Move-in Day!
                        </p>
                    </div>
                </div>
            )}

            {/* COUNTDOWN TIMER */}
            {showCountdown && unit.move_in_date && (
                <div className="px-2 pb-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg py-1 px-1.5 text-center flex items-center justify-center gap-1.5">
                        <span className="text-[10px] text-blue-600 font-medium">Move-in in</span>
                        <span className="text-sm font-bold text-blue-700">{daysUntilMoveIn}d</span>
                    </div>
                </div>
            )}

            {/* ACTIONS */}
            <div className="px-2 pb-2">
                {needsSigning ? (
                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                        bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                    >
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        Sign Lease
                    </button>
                ) : (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => onAccessPortal(unit.agreement_id)}
                            disabled={!canAccessPortal}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                            text-xs font-semibold
                            ${
                                canAccessPortal
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                            {canAccessPortal
                                ? unit.move_in_date && daysUntilMoveIn !== null && daysUntilMoveIn > 0
                                    ? `Portal (${daysUntilMoveIn}d)`
                                    : "Portal"
                                : needsMoveInDate
                                ? "Set Date"
                                : "Portal"}
                        </button>

                        <button
                            onClick={onContactLandlord}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5
                            bg-gray-100 hover:bg-gray-200
                            text-gray-700 rounded-lg text-xs font-semibold"
                        >
                            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                            Chat
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}