"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    FileText,
    Image as ImageIcon,
    Megaphone,
    LayoutDashboard,
    Settings,
    Users,
} from "lucide-react";

export default function AdminCMSPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const navigateTo = (path: string) => {
        setIsNavigating(true);
        setTimeout(() => {
            router.push(path);
            setIsNavigating(false);
        }, 400);
    };

    const cmsSections = [
        {
            title: "Announcements",
            description:
                "Create and manage announcements for tenants, landlords, or all users.",
            icon: Megaphone,
            color: "from-amber-500 to-orange-600",
            path: "/pages/admin/cms/announcements",
        },
        {
            title: "Media Library",
            description:
                "Upload, view, and organize images and videos across the platform.",
            icon: ImageIcon,
            color: "from-blue-500 to-indigo-600",
            path: "/pages/admin/cms/media",
        },
        {
            title: "Header & Hero Sections",
            description:
                "Manage landing headers, landlord portal banners, and marketing visuals.",
            icon: LayoutDashboard,
            color: "from-purple-500 to-pink-600",
            path: "/pages/system_admin/cms/headers",
        },
        {
            title: "Content Pages",
            description:
                "Edit content pages like About, Privacy Policy, Terms of Service, and Help Center.",
            icon: FileText,
            color: "from-green-500 to-emerald-600",
            path: "/pages/admin/cms/content",
        },
        {
            title: "User Highlights",
            description:
                "Manage testimonials, featured landlords, and success stories.",
            icon: Users,
            color: "from-rose-500 to-red-600",
            path: "/pages/admin/cms/highlights",
        },
        {
            title: "System Settings",
            description:
                "Configure content visibility, role-based access, and global display settings.",
            icon: Settings,
            color: "from-slate-500 to-gray-600",
            path: "/pages/admin/cms/settings",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* HEADER */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Content Management System
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage announcements, headers, and public content for UPKYP.
                    </p>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cmsSections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => navigateTo(section.path)}
                            disabled={isNavigating}
                            className={`relative group p-6 rounded-2xl text-left border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 bg-white hover:scale-[1.02] overflow-hidden`}
                        >
                            {/* Accent Gradient */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-10 group-hover:opacity-20 transition-all duration-300`}
                            ></div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div
                                    className={`p-3 rounded-xl bg-gradient-to-br ${section.color} text-white shadow-md`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-800 text-lg">
                                        {section.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* FOOTER */}
            <div className="mt-10 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} UPKYP Admin CMS · Powered by Cloudinary & Next.js
            </div>
        </div>
    );
}
