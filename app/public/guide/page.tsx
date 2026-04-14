"use client";

import Link from "next/link";
import { BackButton } from "@/components/navigation/backButton";
import {
    Wallet,
    Home,
    ArrowRight,
} from "lucide-react";

export default function UserGuideLandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50 p-4 sm:p-6">
            {/* Back Button */}
            <div className="mb-4">
                <BackButton label="Back" />
            </div>

            {/* Header */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
                {/* Accent Gradient */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                    UPKYP User Guide
                </h1>
                <p className="text-gray-600 mt-2 max-w-2xl">
                    Everything you need to know about using UPKYP — from managing properties
                    to handling payments and payouts with confidence.
                </p>
            </div>

            {/* Guide Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Landlord Guide */}
                {/*<GuideCard*/}
                {/*    gradient="from-blue-500 to-indigo-600"*/}
                {/*    iconBg="bg-blue-100"*/}
                {/*    iconColor="text-blue-600"*/}
                {/*    title="Landlord Guide"*/}
                {/*    description="Manage properties, billing, tenant payments, and payouts."*/}
                {/*    href="/pages/landlord/guide"*/}
                {/*/>*/}

                {/* Payment & Payout */}
                <GuideCard
                    gradient="from-emerald-500 to-teal-600"
                    iconBg="bg-emerald-100"
                    iconColor="text-emerald-600"
                    title="Payments & Payouts"
                    description="Understand how tenant payments are processed and how you get paid."
                    href="/pages/landlord/guide/payment"
                />
            </div>
        </div>
    );
}

/* Reusable Card */
function GuideCard({
                       gradient,
                       iconBg,
                       iconColor,
                       title,
                       description,
                       href,
                   }: {
    gradient: string;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link href={href}>
            <div
                className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full
                   hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
                {/* Hover Gradient Border */}
                <div
                    className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                      bg-gradient-to-r ${gradient} transition-opacity duration-300`}
                    style={{ padding: "2px" }}
                >
                    <div className="h-full w-full rounded-2xl bg-white" />
                </div>

                {/* Content */}
                <div className="relative">
                    <div className={`inline-flex items-center justify-center p-3 rounded-xl ${iconBg} mb-4`}>
                        {title === "Landlord Guide" ? (
                            <Home className={`h-6 w-6 ${iconColor}`} />
                        ) : (
                            <Wallet className={`h-6 w-6 ${iconColor}`} />
                        )}
                    </div>

                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {title}
                    </h2>

                    <p className="text-gray-600 mb-4">
                        {description}
                    </p>

                    <div className="flex items-center text-sm font-semibold text-blue-600">
                        View guide
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
