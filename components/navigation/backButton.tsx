"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function BackButton({
    label = "Back",
    landlordFallback = "/landlord/properties",
    tenantFallback = "/tenant/myUnit",
    variant = "default",
}: {
    label?: string;
    landlordFallback?: string;
    tenantFallback?: string;
    variant?: "default" | "ghost" | "gradient";
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        setHasHistory(window.history.length > 1);
    }, []);

    const handleBack = () => {
        const isTenant = pathname?.includes("/tenant");
        const isLandlord = pathname?.includes("/landlord");

        if (hasHistory && window.history.length > 2) {
            router.back();
        } else {
            if (isTenant) {
                router.replace(tenantFallback);
            } else if (isLandlord) {
                router.replace(landlordFallback);
            } else {
                router.replace(tenantFallback);
            }
        }
    };

    const variants = {
        default: `
            inline-flex items-center gap-1.5
            px-2.5 py-1.5
            text-xs font-medium
            bg-white/90 backdrop-blur-sm
            text-gray-600
            border border-gray-200/60
            rounded-lg
            shadow-sm hover:shadow-md
            active:scale-95
            transition-all duration-150
        `,
        ghost: `
            inline-flex items-center gap-1.5
            px-2 py-1.5
            text-xs font-medium
            text-gray-500
            hover:text-gray-800
            hover:bg-gray-100/60
            rounded-lg
            active:scale-95
            transition-all duration-150
        `,
        gradient: `
            inline-flex items-center gap-1.5
            px-2.5 py-1.5
            text-xs font-medium
            bg-gradient-to-r from-blue-600 to-emerald-600
            text-white
            rounded-lg
            shadow-sm hover:shadow-md
            active:scale-95
            transition-all duration-150
        `,
    };

    return (
        <button
            onClick={handleBack}
            className={`${variants[variant]}`}
            aria-label={label}
        >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
