"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaEnvelope,
    FaPhoneAlt,
    FaBuilding,
    FaStar,
    FaHome,
} from "react-icons/fa";
import { BackButton } from "@/components/navigation/backButton";

interface Landlord {
    landlord_id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    photoUrl?: string;
    totalProperties?: number;
    satisfactionScore?: number;
}

export default function LandlordDetailsPage() {
    const { landlord_id } = useParams();
    const router = useRouter();
    const [landlord, setLandlord] = useState<Landlord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        async function fetchLandlord() {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}`);
                if (!res.ok) throw new Error("Failed to fetch landlord");
                setLandlord(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchLandlord();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500 animate-pulse">
                    Loading host profile…
                </p>
            </div>
        );
    }

    if (!landlord) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-500">
                Host not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <BackButton label="Back to listing" />
F
                {/* Host Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-6">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-blue-600 to-emerald-600 p-8 text-white">
                        <div className="flex flex-col items-center text-center">
                            {landlord.photoUrl ? (
                                <img
                                    src={landlord.photoUrl}
                                    alt={landlord.name}
                                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                                    {landlord.name?.charAt(0) || "H"}
                                </div>
                            )}

                            <h1 className="mt-4 text-2xl font-bold">
                                {landlord.name}
                            </h1>

                            {landlord.company && (
                                <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                                    <FaBuilding /> {landlord.company}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
                        <StatCard
                            icon={<FaHome />}
                            label="Properties"
                            value={landlord.totalProperties ?? 0}
                            gradient="from-blue-500 to-blue-700"
                        />
                        <StatCard
                            icon={<FaStar />}
                            label="Satisfaction"
                            value={landlord.satisfactionScore ?? "N/A"}
                            gradient="from-emerald-500 to-green-600"
                        />
                    </div>

                    {/* Contact */}
                    <div className="p-6 space-y-4">
                        {landlord.phone && (
                            <ActionRow
                                icon={<FaPhoneAlt className="text-green-600" />}
                                label="Phone"
                                value={landlord.phone}
                                href={`tel:${landlord.phone}`}
                            />
                        )}

                        {landlord.email && (
                            <ActionRow
                                icon={<FaEnvelope className="text-blue-600" />}
                                label="Email"
                                value={landlord.email}
                                href={`mailto:${landlord.email}`}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================
   UI Components
================================ */

function StatCard({
                      icon,
                      label,
                      value,
                      gradient,
                  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    gradient: string;
}) {
    return (
        <div
            className={`rounded-xl p-4 text-white shadow-md bg-gradient-to-br ${gradient}`}
        >
            <div className="flex items-center justify-center text-xl mb-2">
                {icon}
            </div>
            <p className="text-2xl font-bold text-center">{value}</p>
            <p className="text-xs uppercase tracking-wide text-center opacity-90">
                {label}
            </p>
        </div>
    );
}

function ActionRow({
                       icon,
                       label,
                       value,
                       href,
                   }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {value}
                </p>
            </div>
        </a>
    );
}
