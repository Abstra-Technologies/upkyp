"use client";

import { useState } from "react";
import { Menu, X, Layers } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/navigation/backButton";

export default function UpkypStackLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

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

                {/* 🔙 BACK BUTTON */}
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
                <nav className="flex flex-col gap-2">
                    <Link href="/upkyp_stack" className="sidebar-link">
                        Marketplace
                    </Link>
                    <Link href="/upkyp_stack/myAPI" className="sidebar-link">
                        My API
                    </Link>
                    <Link href="/upkyp_stack/docs" className="sidebar-link">
                        API Docs
                    </Link>
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