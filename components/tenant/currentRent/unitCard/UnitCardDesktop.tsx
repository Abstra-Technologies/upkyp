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
    DocumentTextIcon,
    BuildingOfficeIcon,
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
    onEndContract,
    onRefresh,
}: {
    unit: Unit;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
    onEndContract?: (unitId: string, agreementId: string) => void;
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

    const noRequirements =
        !needsSigning && !needsMoveInDate;

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
        <article className="group relative bg-white rounded-xl border-2 border-gray-300 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-300 overflow-hidden hover:-translate-y-0.5">
            {/* Left accent border */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                unit.leaseSignature === "active"
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-400"
                    : needsSigning
                    ? "bg-gradient-to-b from-amber-500 to-amber-400"
                    : "bg-gradient-to-b from-gray-300 to-gray-200"
            }`} />

            <div className="flex">
                {/* Image Section */}
                <div className="relative w-36 h-full min-h-[180px] overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                        src={
                            unit.unit_photos?.[0] ||
                            process.env.NEXT_PUBLIC_UNIT_PLACEHOLDER!
                        }
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={`Unit ${unit.unit_name}`}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm ${
                            unit.leaseSignature === "active"
                                ? "bg-emerald-500/90 text-white"
                                : unit.leaseSignature === "draft"
                                ? "bg-amber-500/90 text-white"
                                : "bg-gray-500/90 text-white"
                        }`}>
                            {unit.leaseSignature === "active" ? "Active" : unit.leaseSignature === "draft" ? "Draft" : "Pending"}
                        </span>
                    </div>

                    {/* Countdown */}
                    {showCountdown && unit.move_in_date && (
                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 text-center">
                            <p className="text-[9px] font-medium text-blue-600 leading-none">Days Left</p>
                            <p className="text-xl font-bold text-blue-700 leading-none mt-0.5">{daysUntilMoveIn}</p>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <HomeIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <h2 className="font-bold text-base text-gray-900 truncate">
                                    Unit {unit.unit_name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <BuildingOfficeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{unit.property_name}</span>
                            </div>
                        </div>

                        {/* Move-in date badge */}
                        {canAccessPortal && unit.move_in_date && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg flex-shrink-0">
                                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 leading-none">Move-in</p>
                                    <p className="text-xs font-semibold text-emerald-700 leading-none mt-0.5">
                                        {daysUntilMoveIn !== null && daysUntilMoveIn > 0
                                            ? `${daysUntilMoveIn}d`
                                            : daysUntilMoveIn === 0
                                            ? "Today!"
                                            : "Ready"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location & Size */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5 text-blue-500" />
                            {unit.city}, {unit.province}
                        </span>
                        {unit.unit_size && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1">
                                    <HomeIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    {unit.unit_size} sqm
                                </span>
                            </>
                        )}
                    </div>

                    {/* Move-in Date Picker */}
                    {showDatePicker && (
                        <div className="border-t border-gray-100 pt-3 mb-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                <CalendarIcon className="w-3.5 h-3.5 inline mr-1" />
                                Set Move-in Date to Access Portal
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    onClick={handleSetMoveInDate}
                                    disabled={loadingDate || !selectedDate}
                                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                                >
                                    {loadingDate ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Move-in Day Message */}
                    {isToday && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center mb-3">
                            <p className="text-sm font-bold text-emerald-700">
                                Welcome Home! It&apos;s Move-in Day!
                            </p>
                        </div>
                    )}

                    {/* Spacer to push actions to bottom */}
                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {needsSigning ? (
                            <button
                                onClick={() => onAccessPortal(unit.agreement_id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                                bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors"
                            >
                                <DocumentTextIcon className="w-4 h-4" />
                                Sign Lease
                            </button>
                        ) : (
                            <button
                                onClick={() => onAccessPortal(unit.agreement_id)}
                                disabled={!canAccessPortal}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                                font-semibold text-sm transition-all
                                ${
                                    canAccessPortal
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:opacity-95 hover:shadow-md"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                {canAccessPortal
                                    ? unit.move_in_date
                                        ? daysUntilMoveIn !== null && daysUntilMoveIn > 0
                                            ? `Access Portal (${daysUntilMoveIn}d)`
                                            : "Access Portal"
                                        : "Access Portal"
                                    : needsMoveInDate
                                    ? "Set Move-in Date First"
                                    : "Access Portal"}
                            </button>
                        )}

                        <button
                            onClick={onContactLandlord}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 font-semibold text-sm transition-colors"
                        >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            Chat Landlord
                        </button>

                        {unit.leaseSignature === "active" && onEndContract && (
                            <button
                                onClick={() => onEndContract?.(unit.unit_id, unit.agreement_id)}
                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 font-semibold text-sm transition-colors"
                                title="End Lease"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
