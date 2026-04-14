"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import {
  TrendingUp,
  Users,
  Wrench,
  Building2,
  BarChart3,
  PieChart,
} from "lucide-react";

const TenantOccupationChart = dynamic(
  () => import("@/components/landlord/analytics/tenantOccupation"),
  { ssr: false },
);
const PropertyUtilitiesChart = dynamic(
  () => import("@/components/landlord/analytics/propertyUtilityRates"),
  { ssr: false },
);
const MaintenanceCategoriesChart = dynamic(
  () => import("@/components/landlord/analytics/getMaintenanceCategory"),
  { ssr: false },
);
const TenantAgeGroupChart = dynamic(
  () => import("@/components/landlord/analytics/tenantAgegroup"),
  { ssr: false },
);
const AverageLeaseDurationChart = dynamic(
  () => import("@/components/landlord/analytics/AverageLeaseDurationChart"),
  { ssr: false },
);
const LeaseExpiryForecast = dynamic(
  () => import("@/components/landlord/analytics/UnitDistributionChart"),
  { ssr: false },
);
const RevenueExpenseTrendChart = dynamic(
  () => import("@/components/landlord/analytics/RevenueExpenseTrendChart"),
  { ssr: false },
);

import ActiveListingsCard from "@/components/landlord/analytics/activeListings";
import PendingListingsCard from "@/components/landlord/analytics/getPendingListings";
import ScoreCard from "@/components/landlord/analytics/scoreCards";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Skeleton Component
const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-7 bg-gray-200 rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse" />
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
      {/* KPI Cards Skeleton */}
      <section className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse mb-1" />
        <div className="h-4 bg-gray-200 rounded w-80 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-4"
            >
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Trend Skeleton */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="h-5 bg-gray-200 rounded w-56 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-72 animate-pulse" />
          </div>
          <div className="p-4 sm:p-6">
            <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </section>

      {/* Tenant Insights Skeleton */}
      <section className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-1" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50">
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Property Insights Skeleton */}
      <section className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-1" />
        <div className="h-4 bg-gray-200 rounded w-72 animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50">
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default function PropertyPerformancePage() {
  const { user, admin, fetchSession } = useAuthStore();
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !admin) fetchSession();
  }, [user, admin, fetchSession]);

  useEffect(() => {
    if (!user?.landlord_id) return;

    setLoading(true);
    fetch(`/api/analytics/landlord/overview?landlord_id=${user?.landlord_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Analytics API Error:", data.error);
          return;
        }
        setTotalTenants(data.totalTenants || 0);
        setTotalRequests(
          Array.isArray(data.maintenanceCategories)
            ? data.maintenanceCategories.reduce(
                (sum: number, cat: any) => sum + (cat.count || 0),
                0,
              )
            : 0,
        );
      })
      .catch((err) => console.error("Error fetching analytics overview:", err))
      .finally(() => setLoading(false));
  }, [user?.landlord_id]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Property Performance Analytics
            </h1>
            <p className="text-gray-600 text-sm">
              Monitor key metrics and track property performance at a glance
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* 🎯 SECTION 1: KPI Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Key Performance Indicators
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Critical metrics for quick decision-making
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={fadeInUp}>
              <ActiveListingsCard landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <PendingListingsCard landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ScoreCard
                title="Total Active Tenants"
                value={totalTenants}
                borderColor="green"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ScoreCard
                title="Pending Maintenance"
                value={totalRequests}
                borderColor="red"
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 📈 SECTION 2: Revenue Trend */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Revenue vs Expense Trend
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Monthly financial performance overview
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="w-full h-[300px] sm:h-[400px]">
                <RevenueExpenseTrendChart landlordId={user?.landlord_id} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 👥 SECTION 3: Tenant Insights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Tenant Insights
              </h2>
              <p className="text-sm text-gray-600">
                Demographics and occupancy patterns
              </p>
            </div>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <motion.div variants={fadeInUp}>
              <TenantOccupationChart landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <TenantAgeGroupChart landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <AverageLeaseDurationChart landlordId={user?.landlord_id} />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 🏢 SECTION 4: Property Insights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Property Insights
              </h2>
              <p className="text-sm text-gray-600">
                Operational metrics and maintenance tracking
              </p>
            </div>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <motion.div variants={fadeInUp}>
              <PropertyUtilitiesChart landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <MaintenanceCategoriesChart landlordId={user?.landlord_id} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <LeaseExpiryForecast landlordId={user?.landlord_id} />
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
