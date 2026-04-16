"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandlordOnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/landlord/dashboard");
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );
}
