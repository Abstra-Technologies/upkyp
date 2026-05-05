"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { IoClose, IoLogOut, IoSettings, IoChevronForward, IoAlertCircle, IoGrid, IoPerson, IoWallet, IoCard, IoShield } from "react-icons/io5";

const profileNavLinks = [
  {
    href: "/commons/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: IoPerson,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: true,
  },
  {
    href: "/commons/profile/security",
    label: "Security & Privacy",
    shortLabel: "Security",
    icon: IoShield,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: false,
  },
  {
    href: "/commons/landlord/payoutDetails",
    label: "Bank Accounts",
    shortLabel: "Bank Accounts",
    icon: IoWallet,
    roles: ["landlord"],
    exactMatch: false,
  },
  {
    href: "/commons/landlord/subscription",
    label: "View Subscription",
    shortLabel: "Subscription",
    icon: IoCard,
    roles: ["landlord"],
    exactMatch: false,
  },
];

export default function MobileCommonsSidenav({
    isOpen,
    onClose,
    onLogoutClick,
    user,
    mainPageUrl,
    mainPageLabel,
}: {
    isOpen: boolean;
    onClose: () => void;
    onLogoutClick: () => void;
    user: any;
    mainPageUrl: string;
    mainPageLabel: string;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const filteredLinks = profileNavLinks.filter((link) =>
        link.roles.includes(user?.userType || "guest"),
    );

    const isLinkActive = (href: string, exactMatch: boolean) => {
        if (exactMatch) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <div
            className={`lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
                isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Floating Center Modal */}
            <aside
                className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
                    isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                }`}
            >
                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center">
                            <IoGrid className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-base tracking-tight">Menu</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <IoClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="max-h-[75vh] overflow-y-auto">
                    {/* PROFILE */}
                    <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    user?.profilePicture ||
                                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                                }
                                alt="Profile"
                                width={44}
                                height={44}
                                className="rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.companyName || user?.email}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{user?.userType}</p>
                            </div>
                            <Link href="/commons/profile" onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                <IoSettings className="w-5 h-5 text-gray-500" />
                            </Link>
                        </div>
                    </div>

                    {/* BACK BUTTON */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <button
                            onClick={() => {
                                onClose();
                                router.push(mainPageUrl);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all text-left"
                        >
                            <IoChevronForward className="w-3.5 h-3.5 text-blue-600 rotate-180 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-700 truncate">{mainPageLabel}</p>
                        </button>
                    </div>

                    {/* NAV */}
                    <nav className="p-4">
                        {filteredLinks.map(({ label, href, icon: Icon, exactMatch }) => {
                            const active = isLinkActive(href, exactMatch);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                                        active
                                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                            : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? "" : "text-gray-400"}`} />
                                    <span className="text-sm font-medium">{label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* HELP SECTION */}
                    <div className="px-4 py-3 border-t border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
                            <div className="text-sm font-medium mb-0.5">Need Help?</div>
                            <div className="text-xs opacity-90 mb-3">Contact support</div>
                            <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                                Get Support
                            </button>
                        </div>
                    </div>

                    {/* LOGOUT */}
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                onClose();
                                onLogoutClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-sm"
                        >
                            <IoLogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}