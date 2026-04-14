"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { FolderPlus, Folder, AlertCircle } from "lucide-react";

import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import CreateFolderModal from "@/components/landlord/documents/CreateFolderModal";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyDocumentsPage() {
  const { id } = useParams();
  const property_id = id as string;

  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const { subscription, loadingSubscription } = useSubscription(landlordId);

  const maxGB = subscription?.limits?.maxStorage ?? 0;

  const { data: storageData, isLoading: loadingStorage } = useSWR(
    property_id
      ? `/api/landlord/storage/usage?property_id=${property_id}`
      : null,
    fetcher,
  );

  const usedStorageBytes = storageData?.total_bytes ?? 0;
  const usedGB = usedStorageBytes / (1024 * 1024 * 1024);

  const usagePercent = maxGB > 0 ? Math.min((usedGB / maxGB) * 100, 100) : 0;

  const storageLimitReached = maxGB > 0 && usedGB >= maxGB;

  /* ---------------- FOLDERS (TEMP STATE) ---------------- */
  const [folders] = useState<any[]>([]);
  const folderCount = folders.length;

  // LOADING STATE
  if (loadingSubscription || loadingStorage) {
    return (
      <div className="pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          {/* HEADER SKELETON */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* STORAGE USAGE SKELETON */}
          <div className="mb-6 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-emerald-50">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse" />
          </div>

          {/* FOLDERS SKELETON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border rounded-xl p-5 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Documents
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and organize folders for property documents
            </p>
          </div>

          <button
            disabled={storageLimitReached}
            onClick={() => setShowCreateFolder(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
              ${
                storageLimitReached
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
              }`}
          >
            <FolderPlus className="w-4 h-4" />
            Create Folder
          </button>
        </div>

        {/* STORAGE USAGE */}
        {!loadingSubscription && (
          <div className="mb-6 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-emerald-50">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">Storage Usage</span>
              <span className="font-semibold text-blue-700">
                {usedGB.toFixed(2)} / {maxGB} GB
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {storageLimitReached && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-600">
                <AlertCircle className="w-4 h-4" />
                Storage limit reached. Upgrade your plan to upload more files.
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {folderCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-white border rounded-xl">
            <Folder className="w-14 h-14 text-gray-300 mb-4" />

            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              No folders yet
            </h2>

            <p className="text-sm text-gray-600 max-w-sm mb-5">
              Create folders to organize contracts, permits, receipts, IDs, and
              other property documents.
            </p>

            <button
              disabled={storageLimitReached}
              onClick={() => setShowCreateFolder(true)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition
                ${
                  storageLimitReached
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                }`}
            >
              Create your first folder
            </button>
          </div>
        ) : (
          /* FOLDER GRID (future-ready) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder, idx) => (
              <Link
                key={idx}
                href={`/pages/landlord/properties/${property_id}/documents/${folder.id}`}
                className="group bg-white border rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mb-4">
                  <Folder className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {folder.name}
                </h3>

                <p className="text-xs text-gray-600 mt-1">
                  {folder.fileCount} files
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateFolderModal
        propertyId={property_id}
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreated={() => {
          // Future: mutate folders
        }}
        disabled={storageLimitReached}
      />
    </div>
  );
}
