import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 rounded-3xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span className="text-white/90 text-sm font-medium">Free to start</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Ready to Manage
                  <span className="block mt-1 text-emerald-300">Smarter?</span>
                </h2>

                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/80 max-w-lg mx-auto lg:mx-0">
                  Track rent, manage tenants, and keep your property data organized — all in one place.
                </p>

                {/* Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/auth/selectRole"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/about-us"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

              {/* Right - Feature Highlights */}
              <div className="hidden lg:block">
                <div className="space-y-4">
                  {[
                    "Add properties in minutes",
                    "Invite tenants & manage leases",
                    "Track payments & history",
                    "Access property data anytime",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                      </div>
                      <span className="text-white font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Trust badge */}
                <div className="mt-6 text-white/60 text-sm">
                  No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
