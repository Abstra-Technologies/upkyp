'use client'
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon,
  BoltIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import Page_footer from "@/components/navigation/page_footer";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const paymentSteps = [
  {
    step: "1",
    title: "Tenant Pays",
    desc: "Tenant selects a payment method and completes the transaction.",
    icon: <CreditCardIcon className="w-5 h-5 sm:w-7 sm:h-7" />,
    gradient: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 text-blue-600",
    bg: "bg-blue-50",
    border: "border-2 border-blue-200",
  },
  {
    step: "2",
    title: "Xendit Receives",
    desc: "Xendit processes and deposits to the owner's virtual bank account.",
    icon: <BanknotesIcon className="w-5 h-5 sm:w-7 sm:h-7" />,
    gradient: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-2 border-emerald-200",
  },
  {
    step: "3",
    title: "Settlement",
    desc: "Settlement takes 3-4 business days through Xendit.",
    icon: <QrCodeIcon className="w-5 h-5 sm:w-7 sm:h-7" />,
    gradient: "from-amber-500 to-amber-600",
    badge: "bg-amber-100 text-amber-600",
    bg: "bg-amber-50",
    border: "border-2 border-amber-200",
  },
  {
    step: "4",
    title: "Disbursement",
    desc: "Funds are sent to the property owner's linked bank account.",
    icon: <DevicePhoneMobileIcon className="w-5 h-5 sm:w-7 sm:h-7" />,
    gradient: "from-violet-500 to-violet-600",
    badge: "bg-violet-100 text-violet-600",
    bg: "bg-violet-50",
    border: "border-2 border-violet-200",
  },
];

const paymentMethods = [
  {
    name: "E-Wallet",
    icon: <DevicePhoneMobileIcon className="w-4 h-4 sm:w-6 sm:h-6" />,
    fee: "1.8% - 2.3%",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-2 border-blue-200",
  },
  {
    name: "Direct Debit",
    icon: <BanknotesIcon className="w-4 h-4 sm:w-6 sm:h-6" />,
    fee: "1% or Php 15",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-2 border-emerald-200",
  },
  {
    name: "QR PH",
    icon: <QrCodeIcon className="w-4 h-4 sm:w-6 sm:h-6" />,
    fee: "1.4% or Php 15",
    gradient: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    border: "border-2 border-violet-200",
  },
  // {
  //   name: "Credit Card",
  //   icon: <CreditCardIcon className="w-4 h-4 sm:w-6 sm:h-6" />,
  //   fee: "2.9% + ₱15",
  //   gradient: "from-amber-500 to-amber-600",
  //   bg: "bg-amber-50",
  //   border: "border-2 border-amber-200",
  // },
];

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700 border border-blue-200/50"
            >
              <BoltIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              Simple • Fast • Transparent
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="mt-4 sm:mt-6 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900"
            >
              How{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Upkyp
              </span>{" "}
              works
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2"
            >
              Give property owners the leverage of knowing their property data — historical and current — all in one place.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-6 sm:mt-8 flex justify-center"
            >
              <Link
                href="/auth/selectRole"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get started free
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-8 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
              {/* Step 1 */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="text-center p-2 sm:p-6 rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-sm hover:shadow-lg cursor-default"
              >
                <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg mb-2 sm:mb-5">
                  <HomeIcon className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mb-1.5 sm:mb-3">
                  1
                </div>
                <h3 className="text-xs sm:text-xl font-semibold text-gray-900">Add Property</h3>
                <p className="mt-1 text-[10px] sm:text-base text-gray-600 leading-tight">
                  List your property with photos, details, and rental terms.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="text-center p-2 sm:p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 shadow-sm hover:shadow-lg cursor-default"
              >
                <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg mb-2 sm:mb-5">
                  <UserGroupIcon className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold mb-1.5 sm:mb-3">
                  2
                </div>
                <h3 className="text-xs sm:text-xl font-semibold text-gray-900">Invite Tenant</h3>
                <p className="mt-1 text-[10px] sm:text-base text-gray-600 leading-tight">
                  Invite existing tenants or select from prospective applications.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="text-center p-2 sm:p-6 rounded-2xl bg-violet-50 border-2 border-violet-200 shadow-sm hover:shadow-lg cursor-default"
              >
                <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-lg mb-2 sm:mb-5">
                  <ChartBarIcon className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-violet-100 text-violet-600 text-xs font-bold mb-1.5 sm:mb-3">
                  3
                </div>
                <h3 className="text-xs sm:text-xl font-semibold text-gray-900">Manage & Track</h3>
                <p className="mt-1 text-[10px] sm:text-base text-gray-600 leading-tight">
                  Handle payments, track history, and access property data.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Payment Process Flow */}
      <section className="py-8 sm:py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="text-center mb-6 sm:mb-12 px-2">
              <h2 className="text-xl sm:text-4xl font-bold text-gray-900">Payment Process</h2>
              <p className="mt-2 sm:mt-4 text-xs sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Powered by Xendit for secure and reliable transactions.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {paymentSteps.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-3 sm:p-6 rounded-2xl ${item.bg} ${item.border} shadow-sm hover:shadow-lg cursor-default`}
                >
                  <div className={`absolute -top-2 left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg z-10`}>
                    {item.step}
                  </div>
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg ${item.badge} flex items-center justify-center mx-auto mb-2 sm:mb-4 mt-3 sm:mt-2`}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-lg text-center leading-tight">{item.title}</h3>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2 leading-tight">{item.desc}</p>

                  {/* Arrow indicators on mobile */}
                  {i === 0 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 sm:hidden">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 sm:hidden">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 sm:hidden">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Xendit Platform Fees */}
      <section className="py-8 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="text-center mb-6 sm:mb-12 px-2">
              <h2 className="text-xl sm:text-4xl font-bold text-gray-900">Xendit Payment Fees</h2>
              <p className="mt-2 sm:mt-4 text-[11px] sm:text-lg text-gray-600 max-w-2xl mx-auto">
                We're actively working to negotiate the lowest possible fees from Xendit. Your support helps us secure better rates for everyone.
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
              {paymentMethods.map((method, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className={`p-2 sm:p-6 rounded-2xl ${method.bg} ${method.border} shadow-sm hover:shadow-lg text-center cursor-default`}
                >
                  <div className={`w-8 h-8 sm:w-14 sm:h-14 mx-auto rounded-lg bg-gradient-to-br ${method.gradient} flex items-center justify-center text-white shadow-lg mb-2 sm:mb-4`}>
                    {method.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[10px] sm:text-lg">{method.name}</h3>
                  <p className="mt-1 sm:mt-3 text-sm sm:text-2xl font-bold text-gray-900">{method.fee}</p>
                  <p className="text-[8px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">per transaction</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Page_footer />
    </main>
  );
}
