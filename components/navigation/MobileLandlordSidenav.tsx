"use client";

import Link from "next/link";
import Image from "next/image";
import { X, LogOut, Settings, Building, ChevronDown } from "lucide-react";

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
        transition-transform duration-300 ease-in-out flex flex-col max-h-screen`}
            >
                {/* Header */}
                <div
                    className="px-4 py-3 flex justify-between items-center
          bg-gradient-to-r from-blue-600 to-emerald-600
          text-white shrink-0"
                >
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base">Upkyp</h2>
                        <span className="text-xs text-white/70 font-medium">Landlord Portal</span>
                    </div>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {/* LANDLORD PROFILE */}
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    user?.profilePicture ||
                                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                                }
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-lg object-cover border border-gray-200"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.companyName || user?.email}
                                </p>

                                <p className="text-xs text-gray-500">Landlord</p>
                            </div>

                            <Link href="/commons/profile" onClick={onClose}>
                                <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                            </Link>
                        </div>
                    </div>

                    {/* PROPERTY SELECTOR */}
                    <div className="px-3 py-2.5 border-b bg-white relative">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                            My Properties
                        </p>
                        <button
                            onClick={() => setShowPropertyDropdown && setShowPropertyDropdown(!showPropertyDropdown)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all text-left"
                        >
                            <Building className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {selectedProperty ? selectedProperty.property_name : "Select Property"}
                                </p>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown */}
                        {showPropertyDropdown && (
                            <div className="absolute left-3 right-3 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-56 overflow-y-auto">
                                {loadingProperties ? (
                                    <div className="p-3 text-center text-sm text-gray-500">Loading...</div>
                                ) : properties.length === 0 ? (
                                    <div className="p-3 text-center text-sm text-gray-500">No properties yet</div>
                                ) : (
                                    properties.map((prop) => (
                                        <button
                                            key={prop.property_id}
                                            onClick={() => {
                                                onPropertySelect?.(prop);
                                                onClose();
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                                                selectedProperty?.property_id === prop.property_id ? "bg-blue-50" : ""
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <Building className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 truncate">{prop.property_name}</p>
                                        </button>
                                    ))
                                )}
                                <Link
                                    href="/landlord/properties"
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t"
                                >
                                    + Add New Property
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* NAV */}
                    <nav className="p-3 space-y-3">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase">
                                    {group.title}
                                </p>

                                {group.items.map(({ label, href, icon: Icon }) => {
                                    if (!emailVerified) {
                                        return (
                                            <div
                                                key={href}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed text-gray-400"
                                                title="Verify your email first"
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </div>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={onClose}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-3 border-t">
                        <button
                            onClick={() => {
                                onClose();
                                onLogoutClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm shadow-md"
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
