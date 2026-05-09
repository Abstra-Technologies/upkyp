"use client";

import Link from "next/link";
import {
  Home,
  Wrench,
  BarChart3,
  CreditCard,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
import { motion } from "motion/react";

const layers = [
  {
    icon: <Home className="w-5 h-5" />,
    title: "List",
    subtitle: "Rental Listings",
    description:
      "Publish verified rental listings with complete property details.",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconText: "text-blue-600",
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    title: "Manage",
    subtitle: "Properties & Tenants",
    description:
      "Manage units, tenants, maintenance, and documents in one place.",
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconText: "text-purple-600",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Track",
    subtitle: "Activity & Records",
    description:
      "Track rent status, billing history, and property activity in real time.",
    gradient: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconText: "text-indigo-600",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Pay",
    subtitle: "Rent & Utilities",
    description:
      "Secure rent and utility payments with automated billing.",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconText: "text-emerald-600",
  },
];

export default function Process() {
  return (
    <section className="relative py-16 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-5 border border-gray-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
              One Ecosystem
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Built as a Unified Stack
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Every layer connects seamlessly — from listing properties to collecting payments.
          </p>
        </div>

        {/* Central Hub + Layer Cards in One Row */}
        <div className="relative">
          {/* Connection lines - desktop only */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-indigo-200 to-emerald-200" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            {/* Central Layers Hub */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-2xl">
                  <Layers className="w-12 h-12 text-emerald-400" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-xl" />
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ecosystem Core</span>
                </div>
              </div>
            </motion.div>

            {/* Layer Cards */}
            {layers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div
                  className={`relative ${layer.bg} ${layer.border} border-2 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 h-full`}
                >
                  {/* Connector dot */}
                  <div className="hidden lg:block absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />

                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center text-white shadow-lg mb-3`}>
                    {layer.icon}
                  </div>

                  {/* Content */}
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${layer.iconText}`}>
                    Layer {index + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                    {layer.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Central hub above cards */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-xl">
                <Layers className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-lg" />
            </div>
          </div>

          {/* Mobile: Cards in 2x2 grid */}
          <div className="lg:hidden grid grid-cols-2 gap-3">
            {layers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div
                  className={`${layer.bg} ${layer.border} border-2 rounded-xl p-3 hover:shadow-lg transition-all duration-300 h-full`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${layer.gradient} flex items-center justify-center text-white shadow-md mb-2`}>
                    {layer.icon}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${layer.iconText}`}>
                    Layer {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-0.5">
                    {layer.title}
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                    {layer.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ecosystem badge */}
        <div className="mt-10 sm:mt-14 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-900 text-white shadow-lg">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">One Platform. One Ecosystem.</span>
          </div>
        </div>

        {/* Learn More Link */}
        <div className="mt-8 text-center">
          <Link
            href="/public/how-it-works"
            className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            See the full breakdown
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
