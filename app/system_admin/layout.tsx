"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    ChevronDown,
    ChevronRight,
    ScrollText,
    Users2,
    Users,
    Building2,
    Bug,
    EthernetPort,
    Wallet,
    Banknote,
    History
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Accordion state
    const [openSection, setOpenSection] = useState<string | null>("User Management");

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    // Categories
    const sections = [
        {
            title: "User Management",
            items: [
                { label: "Tenant Management", href: "/system_admin/tenant_landlord/tenant_mgt", icon: Users },
                { label: "Suspended Accounts", href: "/system_admin/tenant_landlord/suspendedAccounts", icon: Users },
                { label: "Deactivated Accounts", href: "/system_admin/deactivatedAccounts", icon: Users },

            ],
        },
        {
            title: "Landlord Management",
            items: [
                { label: "Landlord Verification", href: "/system_admin/tenant_landlord/verification", icon: Users },
                { label: "Landlord UserList", href: "/system_admin/tenant_landlord/landlord_mgt", icon: Users },
                { label: "Beta Program", href: "/system_admin/beta_programs", icon: Users },

            ],
        },
        {
            title: "Subscription Plan",
            items: [
                // { label: "Split Rules", href: "/system_admin/split_rules", icon: Users },
                { label: "Plan List", href: "/system_admin/subscription_plans", icon: Users },
                { label: "Plan Features", href: "/system_admin/subscription_plans/features", icon: Users },
                { label: "Plan Limits", href: "/system_admin/subscription_plans/limits", icon: Users },
            ],
        },
        {
            title: "Payments & Payouts",
            items: [
                { label: "Payment Channels", href: "/system_admin/payouts/payment_channels", icon: Banknote },
                { label: "Payments List", href: "/system_admin/payouts/payments_list", icon: Banknote },
                { label: "Payout History", href: "/system_admin/payouts/history", icon: History },
            ],
        },
        {
            title: "Subscription Programs",
            items: [
                { label: "Beta Users List", href: "/system_admin/beta_programs", icon: Users },
                { label: "Plan List", href: "/system_admin/subscription_plans", icon: Users },

            ],
        },
        {
            title: "System Administration",
            items: [
                { label: "Add Co-admin", href: "/system_admin/co_admin/list", icon: Users2 },
            ],
        },
        {
            title: "Property Management",
            items: [
                { label: "Property Verification", href: "/system_admin/propertyManagement/list", icon: Building2 },
                { label: "Content Management", href: "/system_admin/cms", icon: Users2 },
            ],
        },

        {
            title: "Activity & Logs",
            items: [
                { label: "Activity Log", href: "/system_admin/activiyLog", icon: ScrollText },
                { label: "Bug Reports", href: "/system_admin/bug_report/list", icon: Bug },
            ],
        },

        {
            title: "System Configuration",
            items: [
                { label: "IP Configurations", href: "/system_admin/ip_restrict", icon: EthernetPort },
            ],
        },

        {
            title: "Announcements",
            items: [
                { label: "Announcements", href: "/system_admin/annoucement", icon: ScrollText },
            ],
        },
    ];

    return (
        <div className="flex h-screen w-full">
            {/* SIDEBAR */}
            <aside className="w-72 h-full bg-white shadow-lg flex flex-col border-r border-gray-200">
                {/* BRAND HEADER */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <Home className="w-6 h-6 text-blue-600" />
                        <span className="text-xl font-semibold text-blue-600">Upkyp Admin Portal</span>
                    </div>
                </div>

                {/* ACCORDION NAVIGATION */}
                <nav className="flex-1 overflow-y-auto">
                    {sections.map((section) => (
                        <div key={section.title}>
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-100 transition"
                            >
                                <span>{section.title}</span>
                                {openSection === section.title ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>

                            {/* Section Items */}
                            <div
                                className={`transition-all duration-300 overflow-hidden ${
                                    openSection === section.title ? "max-h-96" : "max-h-0"
                                }`}
                            >
                                {section.items.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            className={`flex items-center gap-3 pl-10 pr-4 py-2 text-sm transition rounded-md ${
                                                isActive
                                                    ? "bg-blue-100 text-blue-700 font-semibold"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? "text-blue-700" : "text-gray-500"}`} />
                                            {item.label}

                                            {isActive && (
                                                <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
        </div>
    );
}
