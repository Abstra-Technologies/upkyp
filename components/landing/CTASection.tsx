import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function CTASection() {
    return (
        <section className="py-16 sm:py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="bg-gradient-to-br from-blue-600 to-emerald-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">

                    {/* Heading */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        Ready to Manage
                        <span className="block mt-1 bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
              Smarter?
            </span>
                    </h2>

                    {/* Description */}
                    <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        Join landlords who've ditched the spreadsheets. Start managing your
                        properties the modern way.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">

                        <Link
                            href="/auth/selectRole"
                            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/about-us"
                            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-200"
                        >
                            Learn More About Us
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                    </div>

                    {/* Trust Note */}
                    <p className="mt-8 text-white/60 text-sm">
                        Start Managing in Minutes
                    </p>

                </div>
            </div>
        </section>
    );
}