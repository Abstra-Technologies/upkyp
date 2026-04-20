"use client";

import Link from "next/link";
import Image from "next/image";
import { X, LogOut, Settings } from "lucide-react";

export default function MobileLandlordSidenav({
    isOpen,
    onClose,
    navGroups,
    onLogoutClick,
    landlordId,
    // InviteModal,
    user,
    emailVerified = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    navGroups: {
        title: string;
        items: { label: string; href: string; icon: any }[];
    }[];
    onLogoutClick: () => void;
    landlordId?: number;
    // InviteModal: any;
    user: any;
    emailVerified?: boolean;
}) {
    return (
        <div
            className={`lg:hidden fixed inset-0 z-50 ${
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Sidebar */}
            <aside
                className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl
        transform ${isOpen ? "translate-x-0" : "translate-x-full"}
        transition-transform flex flex-col max-h-screen`}
            >
                {/* Header */}
                <div
                    className="p-4 flex justify-between items-center
          bg-gradient-to-r from-blue-600 to-emerald-600
          text-white shrink-0"
                >
                    <h2 className="font-bold text-lg">Menu</h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {/* LANDLORD PROFILE (FULL, UNCHANGED DATA) */}
                    <div className="px-4 py-4 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    user?.profilePicture ||
                                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                                }
                                alt="Profile"
                                width={44}
                                height={44}
                                className="rounded-xl object-cover border-2 border-gray-200"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.companyName || user?.email}
                                </p>

                                <p className="text-xs text-gray-500">Landlord</p>

                                {/* Subscription */}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                      ${
                          user?.subscription?.plan_name === "pro"
                              ? "bg-emerald-100 text-emerald-700"
                              : user?.subscription?.plan_name === "enterprise"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {user?.subscription?.plan_name
                        ? user.subscription.plan_name.toUpperCase()
                        : "-"}
                  </span>
                                </div>

                                {/* Landlord ID */}
                                {user?.landlord_id && (
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                        ID: {user.landlord_id}
                                    </p>
                                )}
                            </div>

                            <Link href="/commons/profile" onClick={onClose}>
                                <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                            </Link>
                        </div>
                    </div>

                    {/* NAV */}
                    <nav className="p-4 space-y-5">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                                    {group.title}
                                </p>

                                {group.items.map(({ label, href, icon: Icon }) => {
                                    if (!emailVerified) {
                                        return (
                                            <div
                                                key={href}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-50 cursor-not-allowed text-gray-400"
                                                title="Verify your email first"
                                            >
                                                <Icon className="w-5 h-5" />
                                                {label}
                                            </div>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={onClose}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                                        >
                                            <Icon className="w-5 h-5" />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Invite */}
                    {/*{landlordId && (*/}
                    {/*    <div className="p-4 border-t">*/}
                    {/*        <InviteModal landlord_id={landlordId} />*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {/* Logout */}
                    <div className="p-4 border-t">
                        <button
                            onClick={() => {
                                onClose();
                                onLogoutClick();
                            }}
                            className="w-full flex items-center justify-center gap-2
              px-4 py-3 rounded-xl border-2 border-red-200
              text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
