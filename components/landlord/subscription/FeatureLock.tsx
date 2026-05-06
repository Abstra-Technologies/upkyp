"use client";

import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface FeatureLockProps {
    featureName?: string;
    description?: string;
    requiredPlan?: string;
    onUpgrade?: () => void;
    upgradeHref?: string;
    className?: string;
}

export default function FeatureLock({
    featureName = "Premium Feature",
    description = "Upgrade your plan to unlock this feature.",
    requiredPlan,
    onUpgrade,
    upgradeHref = "/public/pricing",
    className = "",
}: FeatureLockProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else if (upgradeHref) {
            router.push(upgradeHref);
        }
    };

    return (
        <div className={`absolute inset-0 z-30 flex items-center justify-center p-4 ${className}`}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 mb-4 sm:mb-6">
                    <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {featureName}
                </h3>

                <p className="text-sm sm:text-base text-gray-600 mb-1">
                    {description}
                </p>


                <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                    <Sparkles className="w-4 h-4" />
                    Upgrade Plan
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
