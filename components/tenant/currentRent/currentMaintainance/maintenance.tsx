"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  HomeIcon,
  Square3Stack3DIcon,
  FunnelIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Request {
  request_id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  category: string;
  status: string;
  photos?: string[];
  created_at?: string;
  schedule_date?: string;
}

interface Props {
  agreement_id: string;
  user_id?: number;
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
    transition: { staggerChildren: 0.1 },
  },
};

// Skeleton Component
const MaintenanceSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-64 h-48 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const MaintenanceRequestList = ({ agreement_id, user_id }: Props) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        user_id: user_id?.toString() || "",
      });
      if (agreement_id)
        queryParams.append("agreement_id", agreement_id.toString());
      const response = await axios.get(
        `/api/maintenance/getTenantMaintance?${queryParams.toString()}`,
      );

      setMaintenanceRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      setMaintenanceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user_id) fetchMaintenanceRequests();
  }, [user_id, agreement_id]);

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in-progress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return <ClockIcon className="w-4 h-4" />;
      case "scheduled":
        return <CalendarDaysIcon className="w-4 h-4" />;
      case "in-progress":
        return <ArrowPathIcon className="w-4 h-4" />;
      case "completed":
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const filteredRequests = useMemo(() => {
    if (filter === "all") {
      return maintenanceRequests;
    }
    return maintenanceRequests.filter(
      (req) => req.status.toLowerCase() === filter,
    );
  }, [maintenanceRequests, filter]);

  const statusCounts = useMemo(
    () => ({
      all: maintenanceRequests.length,
      pending: maintenanceRequests.filter(
        (req) => req.status.toLowerCase() === "pending",
      ).length,
      scheduled: maintenanceRequests.filter(
        (req) => req.status.toLowerCase() === "scheduled",
      ).length,
      "in-progress": maintenanceRequests.filter(
        (req) => req.status.toLowerCase() === "in-progress",
      ).length,
      completed: maintenanceRequests.filter(
        (req) => req.status.toLowerCase() === "completed",
      ).length,
    }),
    [maintenanceRequests],
  );

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
              <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Maintenance Requests
              </h1>
              <p className="text-gray-600 text-sm">
                Track and manage your property maintenance
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href={`/tenant/rentalPortal/${agreement_id}/maintenance/add?agreement_id=${agreement_id}`}
            >
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
                <PlusIcon className="w-5 h-5" />
                Create Request
              </button>
            </Link>
            <Link
              href={`/tenant/maintenance/history?agreement_id=${agreement_id}`}
            >
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <ClockIcon className="w-5 h-5" />
                View History
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <ClockIcon className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700">
                {statusCounts.pending}
              </span>
            </div>
            <p className="text-sm text-amber-600">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">
                {statusCounts.scheduled}
              </span>
            </div>
            <p className="text-sm text-blue-600">Scheduled</p>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <ArrowPathIcon className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">
                {statusCounts["in-progress"]}
              </span>
            </div>
            <p className="text-sm text-purple-600">In Progress</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-700">
                {statusCounts.completed}
              </span>
            </div>
            <p className="text-sm text-emerald-600">Completed</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Filter by Status
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All", icon: Square3Stack3DIcon },
            { key: "pending", label: "Pending", icon: ClockIcon },
            { key: "scheduled", label: "Scheduled", icon: CalendarDaysIcon },
            { key: "in-progress", label: "In Progress", icon: ArrowPathIcon },
            { key: "completed", label: "Completed", icon: CheckCircleIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.key === "in-progress" ? "Progress" : tab.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {statusCounts[tab.key as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {loading ? (
          <MaintenanceSkeleton />
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <WrenchScrewdriverIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === "all"
                ? "No Maintenance Requests Yet"
                : `No ${filter.charAt(0).toUpperCase() + filter.slice(1).replace("-", " ")} Requests`}
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto mb-6">
              {filter === "all"
                ? "Create your first maintenance request to get started."
                : `You don't have any ${filter.replace("-", " ")} maintenance requests right now.`}
            </p>
            {filter === "all" && (
              <Link
                href={`/tenant/rentalPortal/${agreement_id}/maintenance/add?agreement_id=${agreement_id}`}
              >
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
                  <PlusIcon className="w-5 h-5" />
                  Create Request
                </button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${filter}-${filteredRequests.length}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredRequests.map((request) => (
              <motion.div
                key={request.request_id}
                variants={fadeInUp}
                className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image Section */}
                  <div
                    className="relative w-full lg:w-72 h-48 lg:h-auto flex-shrink-0 cursor-pointer group"
                    onClick={() =>
                      request.photos?.[0] && setZoomedImage(request.photos[0])
                    }
                  >
                    {request.photos?.[0] ? (
                      <>
                        <img
                          src={request.photos[0]}
                          alt="Maintenance issue"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <PhotoIcon className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                        <PhotoIcon className="w-12 h-12 mb-2" />
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.subject}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusStyle(
                          request.status,
                        )} flex-shrink-0`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Property
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {request.property_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Unit
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {request.unit_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Category
                        </p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {request.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {request.schedule_date ? "Scheduled" : "Created"}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {request.schedule_date
                            ? new Date(
                                request.schedule_date,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : request.created_at
                              ? new Date(request.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-8 h-8" />
              </button>
              <img
                src={zoomedImage}
                alt="Zoomed"
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceRequestList;
