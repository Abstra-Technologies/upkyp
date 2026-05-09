"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Users, Receipt, Wrench, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

const features = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Property Portfolio",
    description:
      "Manage all your properties in one place—apartments, houses, commercial spaces. Track occupancy, lease terms, and property details effortlessly.",
    gradient: "from-blue-500 to-blue-600",
    image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226235/dashboard_gesrl5.png",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Tenant Management",
    description:
      "Store tenant information, lease agreements, and communication history. Send announcements and handle concerns through a dedicated portal.",
    gradient: "from-purple-500 to-purple-600",
    image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226419/tenantProfile_ljhipv.png",
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: "Billing & Payments",
    description:
      "Automate rent billing, track payment status, and generate receipts. Get notified instantly when tenants pay—or when they're late.",
    gradient: "from-emerald-500 to-emerald-600",
    image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226442/payment_yddeqw.png",
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: "Maintenance Tracking",
    description:
      "Receive and manage maintenance requests digitally. Track progress, assign tasks, and keep tenants updated on repair status.",
    gradient: "from-orange-500 to-orange-600",
    image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226646/payment_ry5u2a.png",
  },
];

export default function FeaturesShowcase() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % features.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + features.length) % features.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section
      id="features"
      className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Powerful Features
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="block mt-1 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Manage Smarter
            </span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Purpose-built tools designed specifically for landlords managing residential and commercial properties.
          </p>
        </div>

        {/* Slideshow */}
        <div
          className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="relative min-h-[420px] sm:min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                {/* Large Background Image */}
                <div className="absolute inset-0 bg-gray-50">
                  <Image
                    src={features[current].image}
                    alt={features[current].title}
                    fill
                    className="object-contain p-6 sm:p-8 lg:p-10"
                    priority
                  />
                </div>

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent sm:via-white/40 sm:to-white/10" />

                {/* Text Content */}
                <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-10 lg:p-14 max-w-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${features[current].gradient} text-white flex items-center justify-center shadow-lg`}
                  >
                    {features[current].icon}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {features[current].title}
                  </h3>
                </div>

                <span className={`text-xs font-bold uppercase tracking-wider mb-3 block ${
                  current === 0 ? "text-blue-600" :
                  current === 1 ? "text-purple-600" :
                  current === 2 ? "text-emerald-600" : "text-orange-600"
                }`}>
                  Feature {current + 1} of {features.length}
                </span>

                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                    {features[current].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-white transition-colors z-20"
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-white transition-colors z-20"
            aria-label="Next feature"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dots + Progress Bar */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-6 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Dots */}
              <div className="flex gap-2">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? `w-8 bg-gradient-to-r ${features[i].gradient}`
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to feature ${i + 1}`}
                  />
                ))}
              </div>

              {/* Auto-play indicator */}
              <div className="text-xs text-gray-400 font-medium">
                {isAutoPlaying ? "Auto-playing" : "Paused"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
