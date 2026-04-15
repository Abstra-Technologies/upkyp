"use client";

import { Building2, Users, Receipt, Wrench, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

export default function FeaturesShowcase() {


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
            image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226442/payment_yddeqw.png", // placeholder
        },
        {
            icon: <Wrench className="w-6 h-6" />,
            title: "Maintenance Tracking",
            description:
                "Receive and manage maintenance requests digitally. Track progress, assign tasks, and keep tenants updated on repair status.",
            gradient: "from-orange-500 to-orange-600",
            image: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776226646/payment_ry5u2a.png", // placeholder
        },
    ];

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
              Purpose-built tools designed specifically for landlords
              managing residential and commercial properties.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 h-full">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white flex items-center justify-center shadow-lg`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Placeholder for Feature Image/Screenshot */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-50">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
