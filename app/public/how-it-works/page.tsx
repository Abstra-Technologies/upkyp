"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BuildingOffice2Icon,
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Page_footer from "@/components/navigation/page_footer";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700 border border-blue-200/50">
                  <BoltIcon className="w-4 h-4 text-blue-600" />
                  Simple • Fast • Transparent
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900"
              >
                How{" "}
                <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  Upkyp
                </span>{" "}
                works
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed"
              >
                Manage your rental properties, communicate with tenants, and
                automate billing — all from one simple dashboard.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/pages/auth/selectRole"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get started free
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/pages/public/support"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  Contact sales
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeInUp}
                className="mt-10 flex items-center gap-6 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>No credit card</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Feature Cards Grid */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <motion.div variants={scaleIn}>
                  <FeatureCard
                    icon={
                      <BuildingOffice2Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                    title="List properties"
                    desc="Add photos, details, and availability in minutes."
                    gradient="from-blue-500 to-blue-600"
                  />
                </motion.div>
                <motion.div variants={scaleIn}>
                  <FeatureCard
                    icon={
                      <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                    title="Digital leases"
                    desc="Generate & sign agreements securely online."
                    gradient="from-emerald-500 to-emerald-600"
                  />
                </motion.div>
                <motion.div variants={scaleIn}>
                  <FeatureCard
                    icon={
                      <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                    title="Auto billing"
                    desc="Monthly bills generated with submeter support."
                    gradient="from-violet-500 to-violet-600"
                  />
                </motion.div>
                <motion.div variants={scaleIn}>
                  <FeatureCard
                    icon={
                      <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                    title="Messaging"
                    desc="Communicate and send announcements easily."
                    gradient="from-amber-500 to-orange-500"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4-Step Flow Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700"
            >
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              Getting Started
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900"
            >
              Simple 4-step flow
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Whether you're a landlord or tenant, UpKyp removes friction from
              property management.
            </motion.p>
          </motion.div>

          {/* Steps - Mobile: Vertical, Desktop: Horizontal */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Connection line - Desktop only */}
            <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-blue-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <motion.div variants={fadeInUp}>
                <StepCard
                  step="1"
                  title="Create account"
                  desc="Sign up as a landlord or tenant. Landlords can create properties and invite tenants."
                  icon={<UserGroupIcon className="w-6 h-6" />}
                  color="blue"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StepCard
                  step="2"
                  title="List units"
                  desc="Add descriptions, photos, amenities, and rental terms for each unit."
                  icon={<HomeIcon className="w-6 h-6" />}
                  color="emerald"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StepCard
                  step="3"
                  title="Automate billing"
                  desc="Set up billing preferences — submetered or consolidated — and we handle the rest."
                  icon={<CurrencyDollarIcon className="w-6 h-6" />}
                  color="violet"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StepCard
                  step="4"
                  title="Manage occupancy"
                  desc="Accept applicants, sign leases, collect payments, and handle maintenance."
                  icon={<DocumentTextIcon className="w-6 h-6" />}
                  color="amber"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="text-center mb-12 sm:mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                <ShieldCheckIcon className="w-4 h-4" />
                Platform Features
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
                Everything you need
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful tools designed specifically for Philippine property
                management.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div variants={fadeInUp}>
                <BenefitCard
                  icon={<CurrencyDollarIcon className="w-6 h-6" />}
                  title="Smart Billing"
                  description="Flexible billing modes for submetered or included utilities, auto-reminders, and multiple payment methods."
                  features={[
                    "Submeter tracking",
                    "Auto-reminders",
                    "Payment history",
                  ]}
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <BenefitCard
                  icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
                  title="Tenant Portal"
                  description="Tenants can view bills, submit payments, and open maintenance tickets — all in one place."
                  features={[
                    "Mobile-friendly",
                    "Bill viewing",
                    "Maintenance requests",
                  ]}
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <BenefitCard
                  icon={<ChartBarIcon className="w-6 h-6" />}
                  title="Property Analytics"
                  description="See page views, inquiries, and engagement so you can optimize your listings."
                  features={[
                    "View tracking",
                    "Inquiry stats",
                    "Performance insights",
                  ]}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Common questions
              </h2>
              <p className="mt-4 text-gray-600">
                Everything you need to know about getting started.
              </p>
            </motion.div>

            <motion.div variants={staggerContainer} className="space-y-4">
              <motion.div variants={fadeInUp}>
                <FaqItem
                  question="Can I charge utilities based on submeter readings?"
                  answer="Yes — UpKyp supports submetered utilities and also provider/included billing types. You can set property-level rates or let tenants pay based on submeter readings."
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <FaqItem
                  question="How do tenants pay rent?"
                  answer="Tenants can pay using the payment methods you enable (bank transfer, e-wallets, etc.). A receipt and ledger are recorded automatically."
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <FaqItem
                  question="Can I invite multiple team members?"
                  answer="Yes — properties can be managed by multiple users depending on your plan."
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <FaqItem
                  question="Is there a free plan?"
                  answer="Yes! You can start with our free tier which includes basic property management features. Upgrade anytime for advanced analytics and automation."
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-emerald-500 p-8 sm:p-12 lg:p-16"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-xl">
                <h3 className="text-3xl sm:text-4xl font-bold text-white">
                  Ready to simplify property management?
                </h3>
                <p className="mt-4 text-lg text-white/90">
                  Start for free — list a property and see the magic. No credit
                  card required.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/pages/auth/selectRole"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Create free account
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/pages/public/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-all duration-200"
                >
                  View plans
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Page_footer />
    </main>
  );
}

/* ---------- Components ---------- */

function FeatureCard({
  icon,
  title,
  desc,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg mb-3 sm:mb-4`}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
  icon,
  color,
}: {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "violet" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
    violet: "bg-violet-100 text-violet-600 border-violet-200",
    amber: "bg-amber-100 text-amber-600 border-amber-200",
  };

  const gradientClasses = {
    blue: "from-blue-600 to-blue-500",
    emerald: "from-emerald-600 to-emerald-500",
    violet: "from-violet-600 to-violet-500",
    amber: "from-amber-600 to-amber-500",
  };

  return (
    <div className="relative group">
      {/* Step number badge */}
      <div
        className={`absolute -top-3 left-6 w-8 h-8 rounded-full bg-gradient-to-br ${gradientClasses[color]} flex items-center justify-center text-white text-sm font-bold shadow-lg z-10`}
      >
        {step}
      </div>

      <div className="pt-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-full">
        <div
          className={`w-12 h-12 rounded-xl ${colorClasses[color]} border flex items-center justify-center mb-4`}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="group p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 h-full">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center text-blue-600 mb-5">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 text-xl">{title}</h3>
      <p className="text-gray-600 mt-3 leading-relaxed">{description}</p>

      <ul className="mt-5 space-y-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 font-medium text-gray-900 list-none">
        <span className="pr-4">{question}</span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-open:bg-blue-100 transition-colors">
          <svg
            className="w-3 h-3 text-gray-500 group-open:text-blue-600 group-open:rotate-180 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </summary>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-2">
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
