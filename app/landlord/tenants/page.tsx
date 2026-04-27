"use client";

import { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantList from "@/components/landlord/properties/listOfCurrentTenants";

export default function TenantsPage() {
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    if (!user?.landlord_id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return <TenantList landlord_id={user?.landlord_id} />;
}
