"use client";

import { useRouter, useParams } from "next/navigation";
import { Home, Eye, Users } from "lucide-react";
import useAuthStore from "@/zustand/authStore";

export default function UnitLandingPage() {
    const router = useRouter();
    const { unit_id } = useParams();
    const { user, fetchSession } = useAuthStore();

    const guard = async (action: () => void) => {
        if (!user) {
            await fetchSession(); // respect existing callback flow
            router.push("/pages/auth/login");
            return;
        }
        action();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Unit Overview
                        </h1>
                        <p className="text-sm text-gray-500">
                            Quick actions for this unit
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Active Tenant */}
                    <button
                        onClick={() =>
                            guard(() =>
                                router.push(
                                    `/pages/landlord/unit/${unit_id}/active-tenant`
                                )
                            )
                        }
                        className="flex items-center gap-3 p-5 rounded-xl border
                                   hover:bg-blue-50 transition shadow-sm"
                    >
                        <Users className="w-6 h-6 text-blue-600" />
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">
                                View Active Tenant
                            </p>
                            <p className="text-sm text-gray-500">
                                Lease & tenant details
                            </p>
                        </div>
                    </button>

                    {/* Unit Details */}
                    <button
                        onClick={() =>
                            guard(() =>
                                router.push(
                                    `/pages/landlord/property-listing/view-unit/${unit_id}`
                                )
                            )
                        }
                        className="flex items-center gap-3 p-5 rounded-xl border
                                   hover:bg-emerald-50 transition shadow-sm"
                    >
                        <Eye className="w-6 h-6 text-emerald-600" />
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">
                                View Unit Details
                            </p>
                            <p className="text-sm text-gray-500">
                                Rent, billing, configuration
                            </p>
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
}
