"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Home,
    UserPlus,
    Megaphone,
    List,
    Wallet,
    Building,
    Users,
    MessageSquareMore,
    Calendar,
    Construction,
    ReceiptText,
    UserPen,
    Zap,
    DollarSign,
} from "lucide-react";

import {
    GRADIENT_DOT,
    SECTION_HEADER,
    SECTION_TITLE,
} from "@/constant/design-constants";

import ScanUnitModal from "@/components/landlord/properties/units/ScanUnitModal";
import ExpenseModal from "@/components/landlord/main_dashboard/ExpenseModal";

export default function QuickActions({
    onAddProperty,
    onInviteTenant,
    onAnnouncement,
    onWorkOrder,
    onIncome,
    emailVerified = false,
}: {
    onAddProperty: () => void;
    onInviteTenant: () => void;
    onAnnouncement: () => void;
    onWorkOrder: () => void;
    onIncome: () => void;
    emailVerified?: boolean;
}) {
    const [scanOpen, setScanOpen] = useState(false);
    const [meterReadingOpen, setMeterReadingOpen] = useState(false);
    const [expenseOpen, setExpenseOpen] = useState(false);

    const handleAction = (onClick: () => void) => {
        if (!emailVerified) return;
        onClick();
    };

    const desktopActions = [
        {
            id: "addProperty",
            label: "Add Property",
            icon: Home,
            onClick: () => handleAction(onAddProperty),
            gradient: "from-blue-500 to-blue-600",
            iconColor: "text-blue-600",
            disabled: !emailVerified,
        },
        {
            id: "inviteTenant",
            label: "Invite Tenant",
            icon: UserPlus,
            onClick: () => handleAction(onInviteTenant),
            gradient: "from-emerald-500 to-emerald-600",
            iconColor: "text-emerald-600",
            disabled: !emailVerified,
        },
        {
            id: "announcement",
            label: " Create Announcement",
            icon: Megaphone,
            onClick: () => handleAction(onAnnouncement),
            gradient: "from-purple-500 to-purple-600",
            iconColor: "text-purple-600",
            disabled: !emailVerified,
        },
        {
            id: "workOrder",
            label: "Create Work Order",
            icon: List,
            onClick: () => handleAction(onWorkOrder),
            gradient: "from-orange-500 to-orange-600",
            iconColor: "text-orange-600",
            disabled: !emailVerified,
        },
        // {
        //     id: "income",
        //     label: "Payouts",
        //     icon: Wallet,
        //     onClick: () => handleAction(onIncome),
        //     gradient: "from-cyan-500 to-cyan-600",
        //     iconColor: "text-cyan-600",
        //     disabled: !emailVerified,
        // },
        {
            id: "expense",
            label: "Record Expense",
            icon: DollarSign,
            onClick: () => handleAction(() => setExpenseOpen(true)),
            gradient: "from-rose-500 to-pink-600",
            iconColor: "text-rose-600",
            disabled: !emailVerified,
        },
    ];

    const mobileActions = [

        {
            label: "Properties",
            href: "/landlord/properties",
            icon: Building,
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            label: "My Tenants",
            href: "/landlord/tenants",
            icon: Users,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            label: "Payouts",
            href: "/landlord/payouts",
            icon: Wallet,
            gradient: "from-cyan-500 to-blue-500",
        },

        {
            label: "Announcements",
            href: "/landlord/announcement",
            icon: Megaphone,
            gradient: "from-orange-500 to-red-500",
        },
        {
            label: "Messages",
            href: "/landlord/chat",
            icon: MessageSquareMore,
            gradient: "from-green-500 to-emerald-500",
        },
        {
            label: "Calendar",
            href: "/landlord/calendar",
            icon: Calendar,
            gradient: "from-rose-500 to-pink-500",
        },

        // {
        //     label: "Transactions",
        //     href: "/landlord/payments",
        //     icon: ReceiptText,
        //     gradient: "from-amber-500 to-orange-500",
        // },
        {
            label: "Work Orders",
            href: "/landlord/maintenance-request",
            icon: Construction,
            gradient: "from-yellow-500 to-amber-500",
        },
        {
            label: "Expenses",
            icon: DollarSign,
            gradient: "from-rose-500 to-pink-500",
            onClick: () => setExpenseOpen(true),
        },
        {
            label: "My Profile",
            href: "/commons/profile",
            icon: UserPen,
            gradient: "from-blue-500 to-indigo-500",
        },

    ];

    return (
        <>
            <div className="md:hidden">
                <div className={`${SECTION_HEADER} mb-3 px-2`}>
                    <span className={GRADIENT_DOT} />
                    <h2 className={`${SECTION_TITLE} text-sm`}>Quick Actions</h2>
                </div>

                <div className="grid grid-cols-4 gap-1.5 px-1">
                    {mobileActions.map(({ label, href, icon: Icon, gradient, onClick }) => (
                        onClick ? (
                            <button
                                key={label}
                                onClick={onClick}
                                className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform"
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
                                >
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[9px] font-medium text-gray-700 text-center leading-tight truncate w-full">
                                    {label}
                                </span>
                            </button>
                        ) : (
                            <Link
                                key={label}
                                href={href!}
                                className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform"
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
                                >
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[9px] font-medium text-gray-700 text-center leading-tight truncate w-full">
                                    {label}
                                </span>
                            </Link>
                        )
                    ))}
                </div>
            </div>

            <div className="hidden md:flex justify-center">
                <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
                    {desktopActions.map(
                        ({ id, label, icon: Icon, onClick, gradient, iconColor, disabled }) => (
                            <button
                                key={id}
                                onClick={onClick}
                                disabled={disabled}
                                className={`group flex flex-col items-center gap-2 transition-all duration-300 ${
                                    disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                                }`}
                                title={disabled ? "Verify your email first" : label}
                            >
                                <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-2xl">
                                    <div className={`absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-sm ring-1 ring-gray-100 group-hover:opacity-0 transition-opacity ${disabled ? "" : ""}`} />
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}
                                    />
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Icon
                                            className={`w-5 h-5 lg:w-6 lg:h-6 ${iconColor} group-hover:text-white transition-colors ${disabled ? "opacity-50" : ""}`}
                                        />
                                    </div>
                                </div>
                                <span className={`text-[11px] font-semibold ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                                    {label}
                                </span>
                            </button>
                        )
                    )}
                </div>
            </div>

            <ScanUnitModal
                isOpen={scanOpen}
                onClose={() => setScanOpen(false)}
            />

            <ExpenseModal
                isOpen={expenseOpen}
                onClose={() => setExpenseOpen(false)}
            />

        </>
    );
}
