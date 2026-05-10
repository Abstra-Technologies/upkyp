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

    const actionItems = [
        {
            label: "Add Property",
            tag: "List a new unit",
            icon: Home,
            onClick: () => handleAction(onAddProperty),
            gradient: "from-blue-500 to-blue-600",
            disabled: !emailVerified,
        },
        {
            label: "Invite Tenant",
            tag: "Add a renter",
            icon: UserPlus,
            onClick: () => handleAction(onInviteTenant),
            gradient: "from-emerald-500 to-emerald-600",
            disabled: !emailVerified,
        },
        {
            label: "Announcement",
            tag: "Notify tenants",
            icon: Megaphone,
            onClick: () => handleAction(onAnnouncement),
            gradient: "from-purple-500 to-purple-600",
            disabled: !emailVerified,
        },
        {
            label: "Work Orders",
            tag: "Request a repair",
            icon: List,
            onClick: () => handleAction(onWorkOrder),
            gradient: "from-orange-500 to-orange-600",
            disabled: !emailVerified,
        },
    ];

    const viewItems = [
        {
            label: "Properties",
            tag: "View all units",
            href: "/landlord/properties",
            icon: Building,
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            label: "Tenants",
            tag: "Manage renters",
            href: "/landlord/tenants",
            icon: Users,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            label: "Disbursements",
            tag: "Payouts & earnings",
            href: "/landlord/payouts",
            icon: Wallet,
            gradient: "from-cyan-500 to-blue-500",
        },
        {
            label: "Messages",
            tag: "Chat inbox",
            href: "/landlord/chat",
            icon: MessageSquareMore,
            gradient: "from-green-500 to-emerald-500",
        },
        {
            label: "Calendar",
            tag: "Schedule & events",
            href: "/landlord/calendar",
            icon: Calendar,
            gradient: "from-rose-500 to-pink-500",
        },
        {
            label: "Maintenance",
            tag: "Work order requests",
            href: "/landlord/maintenance",
            icon: Construction,
            gradient: "from-yellow-500 to-amber-500",
        },
        {
            label: "Expenses",
            tag: "Record spending",
            icon: DollarSign,
            gradient: "from-rose-500 to-pink-500",
            onClick: () => setExpenseOpen(true),
        },
        {
            label: "Profile",
            tag: "My account",
            href: "/commons/profile",
            icon: UserPen,
            gradient: "from-blue-500 to-indigo-500",
        },
    ];

    function renderItem({ label, tag, href, icon: Icon, gradient, onClick, disabled }: {
        label: string; tag: string; href?: string; icon: any; gradient: string; onClick?: () => void; disabled?: boolean;
    }) {
        const content = (
            <>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[9px] font-bold text-gray-800 dark:text-gray-100 text-center leading-none">
                    {label}
                </span>
                <span className="text-[7px] text-gray-400 dark:text-gray-500 text-center leading-none">
                    {tag}
                </span>
            </>
        );

        const classes = "flex flex-col items-center justify-center gap-1 py-2.5 px-0.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-90 transition-all " + (disabled ? "opacity-40 cursor-not-allowed" : "");

        if (onClick) {
            return (
                <button
                    key={label}
                    onClick={onClick}
                    disabled={disabled}
                    className={classes}
                    title={disabled ? "Verify your email first" : label}
                >
                    {content}
                </button>
            );
        }

        return (
            <Link
                key={label}
                href={href!}
                className={classes}
            >
                {content}
            </Link>
        );
    }

    return (
        <>
            <div className="md:hidden space-y-5">
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Do Something</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {actionItems.map((item) => renderItem(item))}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick View</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {viewItems.map((item) => renderItem(item))}
                    </div>
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
                                    <div className={`absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 group-hover:opacity-0 transition-opacity ${disabled ? "" : ""}`} />
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}
                                    />
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Icon
                                            className={`w-5 h-5 lg:w-6 lg:h-6 ${iconColor} group-hover:text-white transition-colors ${disabled ? "opacity-50" : ""}`}
                                        />
                                    </div>
                                </div>
                                <span className={`text-[11px] font-semibold ${disabled ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}`}>
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
