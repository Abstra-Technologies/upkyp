
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
        "You didn't become a landlord to become an accountant. Yet here you are, juggling files, second-guessing balances, and praying you didn't miss a row.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      problem: "Chasing Late Payments",
      description:
        "Nothing kills your weekend like following up on overdue rent. Upkyp automates collections so you get paid without the awkward conversations.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      problem: "Scattered Communication",
      description:
        "A leak in Unit 3, a question from Unit 7, a late notice for Unit 12&mdash;all buried across different apps. Upkyp pulls everything into one place so nothing slips through the cracks.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Does This Sound Like Your Week?
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Being a landlord should mean building wealth, not drowning in busywork.
            </p>
          </motion.div>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
          {painPoints.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-red-100/50 hover:border-red-200 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="mb-2 sm:mb-4 inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-100 text-red-600">
                  {item.icon}
                </div>

                {/* Content */}
                <h3 className="text-xs sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight sm:leading-normal">
                  {item.problem}
                </h3>
                <p className="text-gray-600 text-[10px] sm:text-sm leading-relaxed">
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
            <span>Let&rsquo;s automate the madness</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
