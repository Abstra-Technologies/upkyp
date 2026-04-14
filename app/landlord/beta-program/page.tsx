"use client";

import Page_footer from "@/components/navigation/page_footer";
import { Rocket, ShieldCheck, Users, Percent } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BetaProgramPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-6">
            {/* MAIN CARD */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">

                {/* Badge */}
                <div className="flex justify-center mb-5">
          <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-[11px] sm:text-xs font-bold tracking-wide shadow"
          >
            🚀 UPKYP BETA PROGRAM
          </span>
                </div>

                {/* Headline */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-center text-gray-900 leading-snug">
                    Full Platform Access
                    <br className="hidden sm:block" />
                    <span className="text-blue-600"> with Discounted Transaction Fees</span>
                    <br /> for 2 months.
                </h1>

                {/* Subtext */}
                <p className="mt-3 sm:mt-4 text-center text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                    Experience all UPKYP features during our beta phase.
                    Enjoy reduced transaction fees while helping us refine the platform.
                </p>

                {/* FEATURES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-10">
                    <Feature
                        icon={<Rocket className="text-blue-600" />}
                        title="Unlimited Feature Access"
                        description="Use billing, leases, analytics, automation, and all landlord tools."
                    />

                    <Feature
                        icon={<Percent className="text-red-600" />}
                        title="Discounted Transaction Fees"
                        description="Payments incur transaction fees, but at a reduced beta-only rate."
                    />

                    <Feature
                        icon={<Users className="text-purple-600" />}
                        title="Early Access Advantage"
                        description="Beta users influence features and receive priority after launch."
                    />

                    <Feature
                        icon={<ShieldCheck className="text-green-600" />}
                        title="No Subscription Charges"
                        description="No monthly subscription during beta. Cancel anytime."
                    />
                </div>

                {/* BETA CONDITIONS */}
                <div className="mt-8 sm:mt-10 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 sm:p-5">
                    <h3 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">
                        Beta Program Conditions
                    </h3>
                    <ul className="text-xs sm:text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Limited beta slots available</li>
                        <li>Discounted transaction fees apply</li>
                        <li>Features may change during beta</li>
                        <li>Minor bugs or downtime may occur</li>
                        <li>Feedback participation is encouraged</li>
                    </ul>
                </div>

                {/* CTA */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                        onClick={() => router.push("/pages/landlord/beta-program/joinForm")}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-semibold
            bg-gradient-to-r from-blue-600 to-emerald-600
            hover:from-blue-700 hover:to-emerald-700
            shadow-lg hover:shadow-xl transition-all"
                    >
                        Join Beta – Get Full Access
                    </button>
                </div>

                {/* FOOTNOTE */}
                <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-gray-500 px-2">
                    Beta access includes discounted transaction fees. Standard pricing will
                    apply after beta concludes.
                </p>
            </div>

        </div>
    );
}

/* FEATURE CARD */
function Feature({
                     icon,
                     title,
                     description,
                 }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <div className="shrink-0">{icon}</div>
            <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                    {title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
