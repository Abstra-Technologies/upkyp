"use client";

import { useState } from "react";
import { Menu, X, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "@/components/navigation/backButton";

export default function UpkypStackLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { label: "Marketplace", href: "/upkyp_stack" },
        { label: "My API", href: "/upkyp_stack/myAPI" },
        { label: "API Documentation", href: "/upkyp_stack/documentation" },
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-white">

            {/* MOBILE TOPBAR */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 md:hidden">
                <button onClick={() => setOpen(true)}>
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Upkyp Stack
                </h1>
            </div>

            {/* SIDEBAR */}
            <aside
                className={`fixed z-50 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-5 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >

                {/* MOBILE HEADER */}
                <div className="flex items-center justify-between mb-4 md:hidden">
                    <span className="font-bold text-lg">Menu</span>
                    <button onClick={() => setOpen(false)}>
                        <X />
                    </button>
                </div>

                {/* BACK BUTTON */}
                <div className="mb-4">
                    <BackButton
                        label="Dashboard"
                        tenantFallback="/tenant/dashboard"
                        landlordFallback="/landlord/dashboard"
                        variant="ghost"
                    />
                </div>

                {/* LOGO */}
                <div className="mb-6 flex items-center gap-2">
                    <Layers className="text-blue-600" />
                    <span className="font-bold text-lg">Upkyp Stack</span>
                </div>

                {/* NAV */}
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)} // close on mobile
                                className={`
                  relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200

                  ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-[0.98]"
                                }
                `}
                            >
                                {/* ACTIVE INDICATOR (left border glow) */}
                                {isActive && (
                                    <span className="absolute left-0 top-0 h-full w-1 bg-white/60 rounded-r-full" />
                                )}

                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* OVERLAY */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                />
            )}

            {/* MAIN */}
            <main className="flex-1 md:ml-64 pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}