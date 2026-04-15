"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function BackButton({
                               label = "Back",
                               landlordFallback = "/pages/landlord/property-listing",
                               tenantFallback = "/pages/tenant/myUnit",
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
      flex items-center gap-2
      px-4 py-2.5
      text-sm font-semibold
      bg-white/90 backdrop-blur
      text-gray-700
      border border-gray-200
      rounded-xl
      shadow-sm hover:shadow-md
      active:scale-95
      transition-all duration-200
    `,
        ghost: `
      flex items-center gap-2
      px-3 py-2.5
      text-sm font-medium
      text-gray-600
      hover:text-gray-900
      hover:bg-gray-100
      rounded-xl
      active:scale-95
      transition-all duration-200
    `,
        gradient: `
      flex items-center gap-2
      px-4 py-2.5
      text-sm font-semibold
      bg-gradient-to-r from-blue-600 to-emerald-600
      text-white
      rounded-xl
      shadow-md hover:shadow-lg
      active:scale-95
      transition-all duration-200
    `,
    };

    return (
        <div className="sticky top-0 z-40 bg-transparent py-2">
            <button
                onClick={handleBack}
                className={`
          ${variants[variant]}
          w-fit
          min-h-[44px]  /* mobile tap target */
        `}
                aria-label={label}
            >
                {/* Icon container (better visibility) */}
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </span>

                {/* Text (hidden on very small screens optional) */}
                <span className="hidden xs:inline">
          {label}
        </span>
            </button>
        </div>
    );
}