import Image from "next/image";
import Link from "next/link";

export default function UpkypStackLanding() {
    return (
        <div className="w-full">

            {/* HERO */}
            <section className="px-5 py-14 md:py-24 max-w-7xl mx-auto text-center">

                {/* 🔥 BIGGER IMAGE (mobile optimized) */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44">
                        <Image
                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1776382345/upkyp_stack_sezp3k.png"
                            alt="Upkyp Stack"
                            fill
                            priority
                            className="object-contain rounded-2xl shadow-xl"
                        />
                    </div>
                </div>

                {/* TITLE */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                    Build your rental system with{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Upkyp Stack
          </span>
                </h1>

                {/* DESCRIPTION */}
                <p className="mt-5 text-gray-600 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                    A marketplace of powerful add-ons and APIs designed to extend your
                    rental operations — billing, automation, analytics, and more.
                </p>

                {/* CTA */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="#marketplace"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition"
                    >
                        Explore Marketplace
                    </Link>

                    <Link
                        href="/upkyp_stack/docs"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                        API Docs
                    </Link>
                </div>
            </section>

            {/* MARKETPLACE PREVIEW */}
            <section
                id="marketplace"
                className="px-5 py-14 bg-gradient-to-br from-gray-50 to-white"
            >
                <div className="max-w-6xl mx-auto">

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
                        Marketplace
                    </h2>

                    {/* 🔥 BETTER MOBILE GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[
                            { name: "Auto Billing Engine", tag: "Billing" },
                            { name: "Tenant Insights AI", tag: "Analytics" },
                            { name: "Payment Gateway API", tag: "Finance" },
                        ].map((app, i) => (
                            <div
                                key={i}
                                className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition"
                            >
                <span className="text-xs text-blue-600 font-medium">
                  {app.tag}
                </span>

                                <h3 className="font-semibold text-gray-800 mt-1 text-base">
                                    {app.name}
                                </h3>

                                <button className="mt-4 text-sm text-emerald-600 font-medium hover:underline">
                                    View →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}