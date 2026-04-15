
import {
  ArrowRight,
  Clock,
  FileSpreadsheet,
  MessageSquare,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

export default function PainPointsSection() {
  const painPoints = [
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      problem: "Drowning in Spreadsheets",
      description:
        "Tracking rent, tenants, and maintenance across multiple files is a nightmare waiting to happen.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      problem: "Chasing Late Payments",
      description:
        "Manually following up on overdue rent takes hours you could spend growing your portfolio.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      problem: "Scattered Communication",
      description:
        "Stop searching through Viber, SMS, and Messenger. Upkyp centralizes all tenant requests in one place so you never miss a repair or a payment update.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Sound Familiar?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Managing rental properties shouldn't feel like a second full-time
              job.
            </p>
          </motion.div>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {painPoints.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100/50 hover:border-red-200 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600">
                  {item.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.problem}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transition to Solution */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5" />
            <span>There's a better way</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
