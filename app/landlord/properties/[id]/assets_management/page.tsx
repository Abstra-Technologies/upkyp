"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Plus,
  Wrench,
  Building2,
  Home,
  Eye,
  Trash2,
  Edit2,
  Package,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";
import AddAssetModal from "@/components/landlord/properties/AddAssetModal";
import { AssetCardSkeleton } from "@/components/Commons/SkeletonLoaders";

import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import { subscriptionConfig } from "@/constant/subscription/limits";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const AssetsManagementPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const property_id = id as string;

  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const { subscription, loadingSubscription } = useSubscription(landlordId);

  const [showAddModal, setShowAddModal] = useState(false);

  const [activeFilter, setActiveFilter] = useState<"all" | "property" | "unit">(
    "all",
  );
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: assets,
    isLoading,
    error,
  } = useSWR(
    property_id
      ? `/api/landlord/properties/assets?property_id=${property_id}`
      : null,
    fetcher,
  );

  const planName = subscription?.plan_name as keyof typeof subscriptionConfig;

  const assetConfig = planName ? subscriptionConfig[planName] : null;

  const canUseAssets = assetConfig?.features?.assetManagement === true;

  const maxAssetsPerProperty = assetConfig?.limits?.maxAssetsPerProperty;

  const totalAssets = assets?.length || 0;

  const reachedAssetLimit =
    maxAssetsPerProperty !== null && totalAssets >= maxAssetsPerProperty;

  const { data: propertyDetails } = useSWR(
    property_id
      ? `/api/propertyListing/getPropDetailsById?property_id=${property_id}`
      : null,
    fetcher,
  );

  const { data: units, isLoading: loadingUnits } = useSWR(
    property_id
      ? `/api/unitListing/getUnitListings?property_id=${property_id}`
      : null,
    fetcher,
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAsset = async (asset_id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the asset.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`/api/landlord/assets?asset_id=${asset_id}`);
      Swal.fire("Deleted!", "Asset has been deleted.", "success");
      mutate(`/api/landlord/properties/assets?property_id=${property_id}`);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete asset.", "error");
    }
  };

  const filteredAssets =
    assets?.filter((a: any) => {
      if (activeFilter === "property") return !a.unit_id;
      if (activeFilter === "unit") return a.unit_id;
      return true;
    }) || [];

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedAssets = filteredAssets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "under_maintenance":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Failed to load assets.</p>
        </div>
      </div>
    );
  }

  if (!loadingSubscription && !canUseAssets) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
            <Wrench className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Upgrade Required
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            Asset Management is not available on your current plan. Upgrade to
            track and maintain property assets.
          </p>

          <button
            onClick={() =>
              router.push("/pages/landlord/subsciption_plan/pricing")
            }
            className="w-full px-5 py-2.5 rounded-xl font-semibold text-white
          bg-gradient-to-r from-blue-600 to-emerald-600
          hover:from-blue-700 hover:to-emerald-700 transition-all"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          {/* Header Skeleton */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
              </div>
            </div>

            {/* Action Bar Skeleton */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex gap-2 sm:ml-auto">
                <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Mobile Cards Skeleton */}
          <div className="block md:hidden">
            <AssetCardSkeleton count={5} />
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(7)].map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    {[...Array(7)].map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Asset Management
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  {propertyDetails?.property?.property_name || "Property"} —
                  Track and manage all assets
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <button
                onClick={() => {
                  if (reachedAssetLimit) {
                    Swal.fire({
                      icon: "warning",
                      title: "Asset Limit Reached",
                      text: `Your plan allows up to ${maxAssetsPerProperty} assets per property.`,
                      confirmButtonColor: "#3b82f6",
                    });
                    return;
                  }
                  setShowAddModal(true);
                }}
                disabled={reachedAssetLimit}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5
    rounded-lg font-semibold text-sm transition-all shadow-sm
    ${
      reachedAssetLimit
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
    }`}
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </button>

              {/* Filters */}
              <div className="flex gap-2 sm:ml-auto">
                {["all", "property", "unit"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter as any)}
                    className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                      activeFilter === filter
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-transparent shadow-sm"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {filter === "all"
                      ? "All"
                      : filter === "property"
                        ? "Property"
                        : "Unit"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3 mb-6">
            {paginatedAssets.length === 0 ? (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-900 font-semibold text-base mb-1">
                  No Assets Found
                </p>
                <p className="text-gray-500 text-sm">
                  Add your first asset to get started.
                </p>
              </div>
            ) : (
              paginatedAssets.map((asset: any) => (
                <div
                  key={asset.asset_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base mb-1">
                          {asset.asset_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {asset.category || "Uncategorized"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                          asset.status,
                        )}`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        {asset.unit_name ? (
                          <>
                            <Home className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-700">
                              {asset.unit_name}
                            </span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Property Level
                            </span>
                          </>
                        )}
                      </div>
                      {asset.model && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Model:</span>{" "}
                          {asset.model}
                        </div>
                      )}
                      {asset.warranty_expiry && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Warranty:</span>{" "}
                          {formatDate(asset.warranty_expiry)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/pages/landlord/properties/${property_id}/assets/${asset.asset_id}`,
                          )
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/pages/landlord/properties/${property_id}/assets_management/${asset.asset_id}/edit`,
                          )
                        }
                        className="flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.asset_id)}
                        className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Warranty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-gray-900 font-semibold text-lg mb-1">
                            No Assets Found
                          </p>
                          <p className="text-gray-500 text-sm">
                            Add your first asset to get started.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAssets.map((asset: any) => (
                      <tr
                        key={asset.asset_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900 text-sm">
                            {asset.asset_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {asset.category || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {asset.unit_name ? (
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">
                                {asset.unit_name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Property
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {asset.model || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {asset.warranty_expiry
                            ? formatDate(asset.warranty_expiry)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                              asset.status,
                            )}`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/pages/landlord/properties/${property_id}/assets/${asset.asset_id}`,
                                )
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/pages/landlord/properties/${property_id}/assets_management/${asset.asset_id}/edit`,
                                )
                              }
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.asset_id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredAssets.length > itemsPerPage && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredAssets.length / itemsPerPage)}
                totalItems={filteredAssets.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      <AddAssetModal
        propertyId={property_id}
        units={units}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() =>
          mutate(`/api/landlord/properties/assets?property_id=${property_id}`)
        }
      />
    </>
  );
};

export default AssetsManagementPage;
