"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Wrench,
  BarChart3,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

export default function AnimatedFeaturesPopLoop() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const features = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "List",
      subtitle: "Rental Listings",
      description:
        "Publish verified rental listings for apartments, homes, offices, and warehouses with complete property details.",
      gradient: "from-blue-500 to-blue-600",
      lightGradient: "from-blue-50 to-blue-100",
      glowColor: "shadow-blue-500/20",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Manage",
      subtitle: "Properties & Tenants",
      description:
        "Manage units, tenants, maintenance requests, and documents from a single, centralized platform.",
      gradient: "from-purple-500 to-purple-600",
      lightGradient: "from-purple-50 to-purple-100",
      glowColor: "shadow-purple-500/20",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Track",
      subtitle: "Activity & Records",
      description:
        "Track rent status, billing history, maintenance progress, and property activity in real time.",
      gradient: "from-indigo-500 to-indigo-600",
      lightGradient: "from-indigo-50 to-indigo-100",
      glowColor: "shadow-indigo-500/20",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Pay",
      subtitle: "Rent & Utilities",
      description:
        "Enable secure rent and utility payments with automated billing and clear transaction records.",
      gradient: "from-emerald-500 to-emerald-600",
      lightGradient: "from-emerald-50 to-emerald-100",
      glowColor: "shadow-emerald-500/20",
    },
  ];

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />

      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-5 border border-gray-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
              How Upkyp Works
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            List. Manage. Track. Pay.
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Upkyp is a rental listing and property management platform designed
            to simplify operations for landlords and tenants.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const animateProps = reducedMotion ? {} : { y: [0, -10, 0] };

            const transitionProps = reducedMotion
              ? {}
              : {
                  duration: 1.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  delay: index * 0.25,
                };

            return (
              <motion.div
                key={index}
                animate={animateProps}
                transition={transitionProps}
                className="relative"
              >
                <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                  {/* Hover background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.lightGradient} rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg ${feature.glowColor}`}
                    >
                      {feature.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mb-3">
                      {feature.subtitle}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Learn More Link */}
        <div className="mt-12 text-center">
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
