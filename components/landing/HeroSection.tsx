
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Receipt, Users } from "lucide-react";
import { motion } from "motion/react";
import PaymentPartnersMarquee from "@/components/Commons/PaymentPartnersMarquee";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden will-change-transform">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-emerald-900" />

      {/* Animated Mesh Gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.25),transparent_50%)]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating Elements - CSS Animated for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
      </div>

        <div className="absolute top-2 left-0 right-0 z-30">
            <PaymentPartnersMarquee />
        </div>


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Connect More,
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
                Manage Less
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              The all-in-one platform that helps landlords manage 
              properties, track payments, and connect with tenants—without 
              the spreadsheet chaos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/pages/auth/selectRole"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#features"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                See How It Works
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-white/60 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>60 Days free </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Secure Payments You Can Track</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Built for Property Owners</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Dashboard Mockup Container */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
              
              {/* Main Dashboard Frame */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2 shadow-2xl">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-lg px-4 py-1.5 text-xs text-white/50 text-center">
                      app.upkyp.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content Placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                  {/* Placeholder Dashboard UI */}
                  <div className="p-4 h-full flex flex-col">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500" />
                        <div className="h-4 w-24 bg-white/20 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-white/10 rounded-lg" />
                        <div className="h-8 w-8 bg-white/10 rounded-lg" />
                      </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "Properties", value: "12", color: "from-blue-500 to-blue-600" },
                        { label: "Tenants", value: "28", color: "from-emerald-500 to-emerald-600" },
                        { label: "Collected", value: "₱156K", color: "from-purple-500 to-purple-600" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-white/50">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Content Area */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="h-3 w-20 bg-white/20 rounded mb-3" />
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-white/10" />
                              <div className="flex-1 h-2 bg-white/10 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="h-3 w-24 bg-white/20 rounded mb-3" />
                        <div className="h-full flex items-end gap-1 pb-2">
                          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-emerald-500 to-blue-500 rounded-t opacity-80"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-1/4 bg-white rounded-xl p-4 shadow-xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Payment Received</div>
                    <div className="font-semibold text-gray-900">₱15,000</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-4 bottom-1/4 bg-white rounded-xl p-4 shadow-xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">New Tenant</div>
                    <div className="font-semibold text-gray-900">Unit 4B</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}