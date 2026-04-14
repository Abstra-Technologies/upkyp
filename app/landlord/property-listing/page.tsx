"use client";

import { motion } from "framer-motion";
import Pagination from "@mui/material/Pagination";
import { Building2, Plus, Search, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

import usePropertyListingPage from "@/hooks/landlord/usePropertyListingPage";

import PropertyCard from "@/components/landlord/properties/propertyCards";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import LandlordProfileStatus from "@/components/landlord/profile/LandlordProfileStatus";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// Skeleton Loader
const PropertySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
      >
        <div className="flex gap-4">
          <div className="w-32 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function PropertyListingPage() {
  const router = useRouter();

  const {
    user,
    subscription,
    properties,
    filteredProperties,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    handleView,
    handleEdit,
    handleDelete,
    handleAddProperty,
    itemsPerPage,
    verificationStatus,
    isFetchingVerification,
    hasReachedLimit,
    // isAddDisabled,
    maxProperties,
  } = usePropertyListingPage();

  if (error) {
    return (
      <ErrorBoundary
        error={error?.message || "Failed to load properties."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!user?.landlord_id || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div>
                <div className="h-7 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded-xl w-20 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse" />
            </div>
          </div>
          <div className="h-11 bg-gray-200 rounded-xl max-w-2xl animate-pulse" />
        </div>
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5">
          <PropertySkeleton />
        </div>
      </div>
    );
  }

  const isNotSubscribed = !subscription;
  const isNotVerified =
    !isFetchingVerification && verificationStatus !== "approved";
  const totalCount = properties.length;

  const startIndex = (page - 1) * itemsPerPage;
  const currentPageItems = filteredProperties.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                      Portfolio Overview
                  </h1>
                  <p className="text-gray-600 text-sm">
                      Track and manage all your rental assets in one place
                  </p>
              </div>
          </div>

            <button
                onClick={handleAddProperty}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
                <Plus className="w-5 h-5" />
                Add Property
            </button>

          {/* Counter + CTA */}
          {/*<div className="flex items-center gap-3">*/}
          {/*  <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200 px-4 py-2.5">*/}
          {/*    <span className="text-sm font-bold text-gray-900">*/}
          {/*      {totalCount} /{" "}*/}
          {/*      {subscription*/}
          {/*        ? maxProperties === null*/}
          {/*          ? "∞"*/}
          {/*          : maxProperties*/}
          {/*        : "—"}*/}
          {/*    </span>*/}
          {/*    <span className="text-xs text-gray-500 ml-1">properties</span>*/}
          {/*  </div>*/}

          {/*    <button*/}
          {/*        aria-disabled={isAddDisabled}*/}
          {/*        disabled={isAddDisabled}*/}
          {/*        onClick={handleAddProperty}*/}
          {/*        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${*/}
          {/*            isAddDisabled*/}
          {/*                ? "bg-gray-100 text-gray-400 cursor-not-allowed"*/}
          {/*                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"*/}
          {/*        }`}*/}
          {/*    >*/}
          {/*        <Plus className="w-5 h-5" />*/}
          {/*        Add Property*/}
          {/*    </button>*/}
          {/*</div>*/}

        </div>

        {/* Warnings flows for veri/subsrition */}

        {/*<div className="space-y-3 mb-4">*/}
        {/*  {isNotSubscribed && (*/}
        {/*    <motion.div*/}
        {/*      initial={{ opacity: 0, y: 10 }}*/}
        {/*      animate={{ opacity: 1, y: 0 }}*/}
        {/*      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"*/}
        {/*    >*/}
        {/*      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />*/}
        {/*      <span className="flex-1 text-sm text-amber-800">*/}
        {/*        An active subscription is required to add properties.*/}
        {/*      </span>*/}
        {/*      <button*/}
        {/*        onClick={() =>*/}
        {/*          router.push("/pages/landlord/subsciption_plan/pricing")*/}
        {/*        }*/}
        {/*        className="text-amber-900 text-sm font-semibold underline hover:text-amber-700"*/}
        {/*      >*/}
        {/*        Subscribe now*/}
        {/*      </button>*/}
        {/*    </motion.div>*/}
        {/*  )}*/}

        {/*  <LandlordProfileStatus landlord_id={user?.landlord_id} />*/}
        {/*</div>*/}

        {/* Search */}
        <div className="max-w-2xl relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search properties by name, address, or ID..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
          />
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5 pb-24">
        {currentPageItems.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {currentPageItems.map((property, idx) => (
              <motion.div key={property.property_id} variants={fadeInUp}>
                <PropertyCard
                  property={property}
                  index={startIndex + idx}
                  subscription={subscription}
                  handleView={handleView}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search or add a new property."
                : "Start by adding your first property to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddProperty}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Property
              </button>
            )}
          </motion.div>
        )}

        {filteredProperties.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <Pagination
              count={Math.ceil(filteredProperties.length / itemsPerPage)}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              size="large"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600,
                },
                "& .Mui-selected": {
                  background:
                    "linear-gradient(to right, #2563eb, #10b981) !important",
                  color: "white !important",
                },
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
