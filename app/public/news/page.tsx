'use client'
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MegaphoneIcon,
  CalendarIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
  WrenchIcon,
  BellAlertIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
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
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const newsCategories = [
  { id: "all", label: "All News" },
  { id: "product", label: "Product Updates" },
  { id: "announcement", label: "Announcements" },
  { id: "maintenance", label: "Maintenance" },
  { id: "partnership", label: "Partnerships" },
];

const featuredNews = {
  id: "featured-1",
  category: "product",
  title: "Upkyp 2.0: A Complete Redesign for Modern Property Management",
  description:
    "We're thrilled to announce the biggest update to Upkyp yet. Version 2.0 brings a completely redesigned dashboard, smarter billing automation, real-time analytics, and a brand-new tenant portal that makes property management effortless.",
  date: "May 15, 2026",
  readTime: "5 min read",
  image: "gradient-blue",
};

const newsItems = [
  {
    id: "news-1",
    category: "product",
    title: "Smart Billing Automation Now Available",
    description:
      "Automate rent collection with smart reminders, flexible payment schedules, and automatic late fee calculations. Set it once and let Upkyp handle the rest.",
    date: "May 10, 2026",
    readTime: "3 min read",
    icon: <ChartBarIcon className="w-6 h-6" />,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "news-2",
    category: "announcement",
    title: "Upkyp Expands to Cebu and Davao Markets",
    description:
      "Following strong demand in Metro Manila, we're officially launching our platform in Cebu and Davao. Landlords in these areas can now register and start managing properties.",
    date: "May 5, 2026",
    readTime: "2 min read",
    icon: <GlobeAltIcon className="w-6 h-6" />,
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    id: "news-3",
    category: "maintenance",
    title: "Scheduled Maintenance: May 20, 2026",
    description:
      "We'll be performing system upgrades on May 20 from 2:00 AM to 4:00 AM PHT. During this time, the platform may experience brief intermittent downtime.",
    date: "May 1, 2026",
    readTime: "1 min read",
    icon: <WrenchIcon className="w-6 h-6" />,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "news-4",
    category: "partnership",
    title: "New Partnership with GCash for Seamless Payments",
    description:
      "Tenants can now pay rent directly through GCash with instant confirmation. This integration supports all major e-wallets and bank transfers across the Philippines.",
    date: "Apr 28, 2026",
    readTime: "4 min read",
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    gradient: "from-violet-500 to-violet-600",
  },
  {
    id: "news-5",
    category: "product",
    title: "Digital Lease Signing Now Supports E-Signatures",
    description:
      "Generate, send, and sign lease agreements digitally with legally binding e-signatures. No more printing or scanning documents.",
    date: "Apr 22, 2026",
    readTime: "3 min read",
    icon: <RocketLaunchIcon className="w-6 h-6" />,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "news-6",
    category: "announcement",
    title: "Upkyp Reaches 10,000 Active Landlords Milestone",
    description:
      "Thanks to our growing community, Upkyp has surpassed 10,000 active landlords managing over 50,000 units nationwide. Here's to many more!",
    date: "Apr 15, 2026",
    readTime: "2 min read",
    icon: <MegaphoneIcon className="w-6 h-6" />,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "news-7",
    category: "product",
    title: "New Mobile App Features: Offline Mode & Push Notifications",
    description:
      "Access your property data offline and receive instant push notifications for payments, maintenance requests, and announcements.",
    date: "Apr 8, 2026",
    readTime: "3 min read",
    icon: <BellAlertIcon className="w-6 h-6" />,
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: "news-8",
    category: "maintenance",
    title: "Security Update: Two-Factor Authentication Enhanced",
    description:
      "We've upgraded our 2FA system with support for authenticator apps and hardware security keys for even stronger account protection.",
    date: "Apr 1, 2026",
    readTime: "2 min read",
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    gradient: "from-gray-600 to-gray-700",
  },
];

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700 border border-blue-200/50">
                <SparklesIcon className="w-4 h-4 text-blue-600" />
                Stay Updated
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900"
            >
              News &{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Announcements
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              The latest updates, feature releases, and important announcements
              from the Upkyp platform. Stay informed about what's new and what's
              coming next.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span>Updated weekly</span>
              </div>
              <div className="flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5 text-emerald-600" />
                <span>Never miss an update</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured News */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                <MegaphoneIcon className="w-3.5 h-3.5" />
                Featured
              </span>
            </motion.div>

            <motion.div variants={scaleIn}>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-8 sm:p-12 lg:p-16 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      Product Update
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                      {featuredNews.title}
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed">
                      {featuredNews.description}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        {featuredNews.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        {featuredNews.readTime}
                      </span>
                    </div>
                    <Link
                      href="#"
                      className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Read full story
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="hidden lg:flex items-center justify-center">
                    <div className="w-64 h-64 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <RocketLaunchIcon className="w-24 h-24 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap items-center gap-3 justify-center"
          >
            {newsCategories.map((category, index) => (
              <motion.button
                key={category.id}
                variants={fadeInUp}
                transition={{ delay: index * 0.05 }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  index === 0
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {newsItems.map((news, index) => (
              <motion.div key={news.id} variants={fadeInUp}>
                <NewsCard news={news} index={index} />
              </motion.div>
            ))}
          </motion.div>

          {/* Load More */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
              Load more articles
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 sm:p-12 lg:p-16"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative max-w-2xl mx-auto text-center">
              <BellAlertIcon className="w-12 h-12 text-blue-400 mx-auto mb-6" />
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Never miss an update
              </h3>
              <p className="mt-4 text-lg text-gray-300">
                Subscribe to our newsletter and get the latest news, feature
                updates, and announcements delivered straight to your inbox.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
                <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
                  Subscribe
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                No spam, unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700"
            >
              <CalendarIcon className="w-4 h-4" />
              Recent Activity
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900"
            >
              What's happening
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            >
              A quick look at our recent milestones and upcoming events.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative"
          >
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-emerald-200 to-blue-200 sm:-translate-x-1/2" />

            <TimelineItem
              date="May 2026"
              title="Platform 2.0 Launch"
              description="Complete redesign with new dashboard, analytics, and tenant portal."
              side="left"
              color="blue"
            />
            <TimelineItem
              date="April 2026"
              title="GCash Integration"
              description="Seamless e-wallet payments now available for all tenants."
              side="right"
              color="emerald"
            />
            <TimelineItem
              date="March 2026"
              title="10,000 Landlords Milestone"
              description="Celebrating our growing community across the Philippines."
              side="left"
              color="violet"
            />
            <TimelineItem
              date="February 2026"
              title="Cebu & Davao Expansion"
              description="Platform now available in Visayas and Mindanao regions."
              side="right"
              color="amber"
            />
          </motion.div>
        </div>
      </section>

      <Page_footer />
    </main>
  );
}

function NewsCard({
  news,
  index,
}: {
  news: (typeof newsItems)[0];
  index: number;
}) {
  const categoryColors: Record<string, string> = {
    product: "bg-blue-100 text-blue-700",
    announcement: "bg-emerald-100 text-emerald-700",
    maintenance: "bg-amber-100 text-amber-700",
    partnership: "bg-violet-100 text-violet-700",
  };

  const categoryLabels: Record<string, string> = {
    product: "Product Update",
    announcement: "Announcement",
    maintenance: "Maintenance",
    partnership: "Partnership",
  };

  return (
    <div className="group h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${news.gradient} flex items-center justify-center text-white shadow-lg`}
        >
          {news.icon}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[news.category] || "bg-gray-100 text-gray-700"}`}
        >
          {categoryLabels[news.category] || news.category}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
        {news.title}
      </h3>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">
        {news.description}
      </p>

      <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {news.date}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {news.readTime}
          </span>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  description,
  side,
  color,
}: {
  date: string;
  title: string;
  description: string;
  side: "left" | "right";
  color: "blue" | "emerald" | "violet" | "amber";
}) {
  const dotColors = {
    blue: "bg-blue-500 ring-blue-200",
    emerald: "bg-emerald-500 ring-emerald-200",
    violet: "bg-violet-500 ring-violet-200",
    amber: "bg-amber-500 ring-amber-200",
  };

  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex items-center mb-8 last:mb-0 sm:mb-12 ${
        side === "left" ? "sm:flex-row" : "sm:flex-row-reverse"
      } flex-row`}
    >
      <div
        className={`flex-1 ${side === "left" ? "text-left pr-8 sm:pr-12 sm:text-right" : "text-left pl-8 sm:pl-12"} pl-12 sm:pl-0`}
      >
        <span className="text-sm font-medium text-gray-400">{date}</span>
        <h4 className="mt-1 font-semibold text-gray-900 text-lg">{title}</h4>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>

      <div
        className={`absolute left-4 sm:left-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${dotColors[color]} ring-4 ring-white sm:-translate-x-1/2 z-10`}
      />

      <div className="hidden sm:block flex-1" />
    </motion.div>
  );
}
