import { motion } from "motion/react";
import { ShieldCheck, Building2, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

const trustPoints = [
  {
    icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Powered by Xendit",
    desc: "Enterprise-grade payment infrastructure. Every transaction is processed through Xendit&rsquo;s regulated and audited platform.",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Unique Virtual Accounts per Tenant",
    desc: "Each tenant gets their own VA number. Payments are matched and reconciled automatically—no manual verification needed.",
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: "Bank-Grade Security",
    desc: "SSL encryption, PCI-compliant payment handling, and secure data storage. Your portfolio data stays private and protected.",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-600",
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest">The Allies</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Built on Trusted Infrastructure.
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            We partner with established technology providers so you get enterprise-grade reliability from day one.
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {trustPoints.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${item.bg} ${item.border} border-2 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300 h-full`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg mb-3`}>
                {item.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/public/how-it-works"
            className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            See how the technology works
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
