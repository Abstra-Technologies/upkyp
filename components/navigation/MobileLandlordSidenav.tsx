"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IoClose, IoLogOut, IoSettings, IoBusiness, IoChevronDown, IoChevronForward } from "react-icons/io5";

interface Property {
  property_id: number;
  property_name: string;
  city: string;
  province: string;
}

export default function MobileLandlordSidenav({
    isOpen,
    onClose,
    navGroups,
    onLogoutClick,
    user,
    emailVerified = false,
    properties = [],
    selectedProperty,
    onPropertySelect,
    showPropertyDropdown,
    setShowPropertyDropdown,
    loadingProperties = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    navGroups: {
        title: string;
        items: { label: string; href: string; icon: any }[];
    }[];
    onLogoutClick: () => void;
    user: any;
    emailVerified?: boolean;
    properties?: Property[];
    selectedProperty?: Property | null;
    onPropertySelect?: (prop: Property) => void;
    showPropertyDropdown?: boolean;
    setShowPropertyDropdown?: (show: boolean) => void;
    loadingProperties?: boolean;
}) {
    const pathname = usePathname();
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const isActive = (href: string) => {
        if (href === "/landlord/dashboard") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    const toggleSection = (title: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <div
            className={`lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 ${
                isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            } transition-opacity duration-300`}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Floating Sidebar */}
            <aside
                className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden
                transform transition-all duration-300 ease-out ${
                    isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                }`}
            >
                {/* Slim Header */}
                <div className="px-4 py-3 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
                            <IoBusiness className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-sm tracking-tight">Upkyp Landlord</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <IoClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="max-h-[75vh] overflow-y-auto">
                    {/* LANDLORD PROFILE */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2.5">
                            <Image
                                src={
                                    user?.profilePicture ||
                                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                                }
                                alt="Profile"
                                width={36}
                                height={36}
                                className="rounded-full object-cover border-2 border-white shadow-sm"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs truncate">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.companyName || user?.email}
                                </p>
                                <p className="text-[10px] text-gray-500">Landlord</p>
                            </div>

                            <Link href="/commons/profile" onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                <IoSettings className="w-4 h-4 text-gray-500" />
                            </Link>
                        </div>
                    </div>

                    {/* PROPERTY SELECTOR */}
                    <div className="px-4 py-2.5 border-b border-gray-100 relative">
                        <button
                            onClick={() => setShowPropertyDropdown && setShowPropertyDropdown(!showPropertyDropdown)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left"
                        >
                            <IoBusiness className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">
                                    {selectedProperty ? selectedProperty.property_name : "Select Property"}
                                </p>
                            </div>
                            <IoChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown */}
                        {showPropertyDropdown && (
                            <div className="absolute left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto">
                                {loadingProperties ? (
                                    <div className="p-3 text-center text-xs text-gray-500">Loading...</div>
                                ) : properties.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-gray-500">No properties yet</div>
                                ) : (
                                    properties.map((prop) => (
                                        <button
                                            key={prop.property_id}
                                            onClick={() => {
                                                onPropertySelect?.(prop);
                                                onClose();
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                                                selectedProperty?.property_id === prop.property_id ? "bg-blue-50" : ""
                                            }`}
                                        >
                                            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <IoBusiness className="w-3 h-3 text-blue-600" />
                                            </div>
                                            <p className="text-xs font-medium text-gray-800 truncate">{prop.property_name}</p>
                                        </button>
                                    ))
                                )}
                                <Link
                                    href="/landlord/properties"
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t"
                                >
                                    + Add New Property
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* NAV */}
                    <nav className="p-3">
                        {navGroups.map((group) => {
                            const isCollapsed = collapsedSections[group.title];
                            return (
                                <div key={group.title} className="mb-3">
                                    <button
                                        onClick={() => toggleSection(group.title)}
                                        className="w-full flex items-center justify-between px-2 py-1.5 group"
                                    >
                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                                            {group.title}
                                        </span>
                                        <IoChevronForward className={`w-3 h-3 text-gray-300 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`} />
                                    </button>
                                    {!isCollapsed && (
                                        <div className="space-y-0.5 mt-1">
                                            {group.items.map(({ label, href, icon: Icon }) => {
                                                const active = isActive(href);

                                                if (!emailVerified) {
                                                    return (
                                                        <div
                                                            key={href}
                                                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg opacity-50 cursor-not-allowed text-gray-400"
                                                            title="Verify your email first"
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                            <span className="text-xs">{label}</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={href}
                                                        href={href}
                                                        onClick={onClose}
                                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                                                            active
                                                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                                                : "hover:bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        <Icon className={`w-4 h-4 ${active ? "" : "text-gray-400"}`} />
                                                        <span className="text-xs font-medium">{label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                onClose();
                                onLogoutClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-xs"
                        >
                            <IoLogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}