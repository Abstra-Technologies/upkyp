
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-white">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.3),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Ready to Manage
              <span className="block mt-1 bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
                Smarter?
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join landlords who've ditched the spreadsheets. Start
              managing your properties the modern way.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pages/auth/selectRole"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/pages/about-us"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
        </motion.div>
      </div>
    </section>
  );
}
