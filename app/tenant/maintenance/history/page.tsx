"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import useAuth from "../../../../../hooks/useSession";
import {
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  HomeIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface MaintenanceRequest {
  request_id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  category: string;
  status: string;
  maintenance_photos: string[];
  created_at?: string;
  completed_at?: string;
}

export default function MaintenanceHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [agreementId, setAgreementId] = useState<string | null>(null);

  useEffect(() => {
    // Get agreement_id from URL params
    const params = new URLSearchParams(window.location.search);
    const id = params.get("agreement_id");
    setAgreementId(id);

    const fetchCompletedRequests = async () => {
      try {
        const response = await axios.get(
          `/api/maintenance/viewHistory?tenant_id=${user?.tenant_id}`
        );
        setHistory(response.data);
        console.log("Fetched Maintenance History:", response.data);
      } catch (error) {
        console.error("Error fetching maintenance history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.tenant_id) {
      fetchCompletedRequests();
    }
  }, [user]);

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      plumbing: "🚿",
      electrical: "⚡",
      hvac: "🌡️",
      appliance: "🔌",
      structural: "🏗️",
      cleaning: "🧽",
      pest_control: "🐛",
      security: "🔒",
    };
    return iconMap[category?.toLowerCase()] || "🔧";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const nextPhoto = (photos: string[]) => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (photos: string[]) => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const openModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setCurrentPhotoIndex(0);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/pages/tenant/maintenance${
                agreementId ? `?agreement_id=${agreementId}` : ""
              }`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-semibold transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back to Maintenance
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Maintenance History
                </h1>
                <p className="text-sm text-gray-600">
                  View all your completed maintenance requests
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">
                  Loading maintenance history...
                </span>
              </div>
            </div>
          ) : history.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Completed Requests Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Your completed maintenance requests will appear here once
                  they've been resolved.
                </p>
                <Link
                  href={`/pages/tenant/maintenance${
                    agreementId ? `?agreement_id=${agreementId}` : ""
                  }`}
                >
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
                    <WrenchScrewdriverIcon className="w-5 h-5" />
                    View Active Requests
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            /* History List */
            <>
              {/* Stats Banner */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {history.length}
                      </p>
                      <p className="text-sm font-semibold text-gray-600">
                        Completed Requests
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Total Resolution Time
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      Excellent Service
                    </p>
                  </div>
                </div>
              </div>

              {/* History Cards */}
              <div className="space-y-4">
                {history.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      <div className="w-full md:w-64 lg:w-80 h-48 md:h-auto flex-shrink-0">
                        {request.maintenance_photos &&
                        request.maintenance_photos.length > 0 &&
                        request.maintenance_photos[0] ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={request.maintenance_photos[0]}
                              alt="Completed maintenance"
                              fill
                              className="object-cover cursor-pointer"
                              onClick={() => openModal(request)}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            {request.maintenance_photos.length > 1 && (
                              <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                                <PhotoIcon className="w-4 h-4" />
                                {request.maintenance_photos.length} photos
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm font-medium text-gray-500">
                                No Photos
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                              {request.subject}
                            </h3>
                            <p className="text-gray-600 leading-relaxed line-clamp-2">
                              {request.description}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 flex-shrink-0">
                            <CheckCircleIcon className="w-4 h-4" />
                            Completed
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg">
                              <HomeIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Property
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {request.property_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg">
                              <span className="text-xl">🚪</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Unit
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {request.unit_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg">
                              <span className="text-xl">
                                {getCategoryIcon(request.category)}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Category
                              </p>
                              <p className="text-sm font-bold text-gray-900 capitalize">
                                {request.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg">
                              <CalendarDaysIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Completed
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {formatDate(
                                  request.completed_at || request.created_at
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* View Photos Button */}
                        {request.maintenance_photos &&
                          request.maintenance_photos.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => openModal(request)}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <PhotoIcon className="w-4 h-4" />
                                <span>View All Photos</span>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Photo Gallery Modal */}
        {selectedRequest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              setSelectedRequest(null);
              setCurrentPhotoIndex(0);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between z-10">
                <div className="flex-1 pr-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedRequest.subject}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                      <CheckCircleIcon className="w-4 h-4" />
                      Completed
                    </span>
                    <span>•</span>
                    <span>{formatDate(selectedRequest.completed_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setCurrentPhotoIndex(0);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Photo Gallery */}
              {selectedRequest.maintenance_photos &&
                selectedRequest.maintenance_photos.length > 0 && (
                  <div className="relative w-full h-96 bg-gray-100">
                    <Image
                      src={
                        selectedRequest.maintenance_photos[currentPhotoIndex]
                      }
                      alt={`Maintenance photo ${currentPhotoIndex + 1}`}
                      fill
                      className="object-contain"
                    />

                    {/* Navigation */}
                    {selectedRequest.maintenance_photos.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            prevPhoto(selectedRequest.maintenance_photos)
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() =>
                            nextPhoto(selectedRequest.maintenance_photos)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-sm font-bold rounded-full backdrop-blur-sm">
                          {currentPhotoIndex + 1} /{" "}
                          {selectedRequest.maintenance_photos.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

              {/* Modal Content */}
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {selectedRequest.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Property</p>
                    <p className="text-gray-900">
                      {selectedRequest.property_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Unit</p>
                    <p className="text-gray-900">{selectedRequest.unit_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Category</p>
                    <p className="text-gray-900 capitalize">
                      {selectedRequest.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">
                      Completion Date
                    </p>
                    <p className="text-gray-900">
                      {formatDate(selectedRequest.completed_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Page_footer */}
              <div className="border-t-2 border-gray-200 p-6">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setCurrentPhotoIndex(0);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
