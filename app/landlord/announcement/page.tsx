"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";
import useSubscription from "@/hooks/landlord/useSubscription";
import DOMPurify from "dompurify";
import { subscriptionConfig } from "@/constant/subscription/limits";
import {
  Megaphone,
  Plus,
  Search,
  X,
  Clock,
  ChevronRight,
  Building2,
  Filter,
} from "lucide-react";

interface Announcement {
  id: string | number;
  subject: string;
  description: string;
  property: string;
  created_at?: string;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

// Skeleton Component
const AnnouncementSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
    <div className="hidden sm:grid sm:grid-cols-5 bg-gray-50 border-b border-gray-200 px-6 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      ))}
    </div>
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 rounded-lg w-24" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function AnnouncementsList() {
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  const landlordId = user?.landlord_id;
  const { subscription, loadingSubscription } = useSubscription(landlordId);

  const planName = subscription?.plan_name;
  const canUseAnnouncements =
    planName && subscriptionConfig[planName]?.features?.announcements === true;

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch(
          `/api/landlord/announcement/getAllAnnouncements?landlord_id=${user?.landlord_id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await response.json();
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Unable to load announcements.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id) {
      fetchAnnouncements();
    }
  }, [user]);

  const handleCreate = () => {
    router.push(`/pages/landlord/announcement/create-announcement`);
  };

  const uniqueProperties: string[] = [
    ...new Set(announcements.map((ann) => ann.property)),
  ];

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty =
      selectedProperty === "all" || announcement.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div>
                <div className="h-7 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
              </div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl w-48 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-11 bg-gray-200 rounded-xl flex-1 animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-xl w-48 animate-pulse" />
          </div>
        </div>
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5">
          <AnnouncementSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Announcements
              </h1>
              <p className="text-gray-600 text-sm">
                Manage and share updates with your tenants
              </p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canUseAnnouncements}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              canUseAnnouncements
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {announcements.length}
              </span>{" "}
              Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {uniqueProperties.length}
              </span>{" "}
              Properties
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {filteredAnnouncements.length}
              </span>{" "}
              Showing
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="sm:w-64 relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Properties</option>
              {uniqueProperties.map((property) => (
                <option key={property} value={property}>
                  {property}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedProperty !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedProperty("all");
              }}
              className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {filteredAnnouncements.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Table Header (Desktop) */}
            <div className="hidden sm:grid sm:grid-cols-5 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 px-6 py-4">
              <div>Property</div>
              <div>Subject</div>
              <div>Details</div>
              <div className="text-right">Date</div>
              <div className="text-right">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div key={announcement.id} variants={fadeInUp}>
                  <Link
                    href={`/pages/landlord/announcement/${announcement.id}`}
                    className="group block transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-emerald-50/50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-5 items-start sm:items-center px-5 sm:px-6 py-4 text-sm">
                      {/* Property */}
                      <div className="flex items-center sm:justify-start mb-2 sm:mb-0">
                        <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                          {announcement.property}
                        </span>
                      </div>

                      {/* Subject */}
                      <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {announcement.subject}
                      </div>

                      {/* Description */}
                      <div
                        className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-1 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(announcement.description),
                        }}
                      />

                      {/* Date */}
                      <div className="flex items-center justify-start sm:justify-end text-xs text-gray-500 gap-1.5 mt-2 sm:mt-0">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(announcement.created_at)}
                      </div>

                      {/* Action */}
                      <div className="flex justify-start sm:justify-end items-center text-sm font-medium text-blue-600 gap-1 mt-2 sm:mt-0">
                        View details
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Megaphone className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">
              No announcements found
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {searchTerm || selectedProperty !== "all"
                ? "Try adjusting your filters to find what you're looking for."
                : "Create your first announcement to keep your tenants informed."}
            </p>
            {!searchTerm &&
              selectedProperty === "all" &&
              canUseAnnouncements && (
                <button
                  onClick={handleCreate}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Announcement
                </button>
              )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
