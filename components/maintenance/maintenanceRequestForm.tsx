"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";
import { useAssetWithQR } from "@/hooks/workorders/useAssetWithQR";

import {
  WrenchScrewdriverIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  HomeIcon,
  BuildingOffice2Icon,
  WrenchIcon,
  QrCodeIcon,
  PhotoIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { BackButton } from "../navigation/backButton";

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */
const maintenanceSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
});

/* -------------------------------------------------------------------------- */
/* ANIMATION VARIANTS                                                          */
/* -------------------------------------------------------------------------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                   */
/* -------------------------------------------------------------------------- */
export default function MaintenanceRequestForm() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id");

  /* ----------------------------- ASSET + QR (HOOK) ------------------------ */
  const {
    assetId,
    assetDetails,
    loadingAsset,
    showScanner,
    setAssetId,
    setShowScanner,
  } = useAssetWithQR({
    userId: user?.user_id,
    agreementId: agreement_id,
  });

  /* ----------------------------- FORM STATE ------------------------------- */
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ----------------------------- FILE HANDLING ---------------------------- */
  const processFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    // Create preview URLs
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));

    setPhotos((prev) => [...prev, ...imageFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const removePhoto = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(photoPreviews[index]);

    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /* ----------------------------- SUBMIT ----------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = maintenanceSchema.safeParse({
      category: selectedCategory,
      description,
    });

    if (!validation.success) {
      setIsSubmitting(false);
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please complete all required fields.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.append("agreement_id", agreement_id || "");
      fd.append("category", selectedCategory);
      fd.append("subject", selectedCategory);
      fd.append("description", description);
      fd.append("is_emergency", isEmergency ? "1" : "0");
      fd.append("user_id", user?.user_id || "");

      if (assetId) fd.append("asset_id", assetId);
      photos.forEach((p) => fd.append("photos", p));

      const res = await axios.post("/api/maintenance/createMaintenance", fd);

      if (res.data?.success) {
        // Clean up preview URLs
        photoPreviews.forEach((url) => URL.revokeObjectURL(url));

        Swal.fire({
          icon: "success",
          title: "Submitted!",
          text: "Your maintenance request has been sent.",
          confirmButtonColor: "#10b981",
        }).then(() =>
          router.push(
            `app/tenant/rentalPortal/${agreement_id}/maintenance?agreement_id=${agreement_id}`,
          ),
        );
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Submission failed. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* UI                                                                         */
  /* -------------------------------------------------------------------------- */
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
                Maintenance Request
              </h1>
              <p className="text-gray-600 text-sm">
                Report an issue and we'll get it fixed
              </p>
            </div>
          </div>
          <BackButton label="Back to Requests" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
          >
            {/* ASSET CODE + QR */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <QrCodeIcon className="w-4 h-4 text-gray-500" />
                Asset Code (optional)
              </label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Enter or scan the asset code if this issue is related to a
                specific item
              </p>
              <div className="flex gap-2">
                <input
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter or scan asset code"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              </div>

              {loadingAsset && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading asset information…
                </div>
              )}

              {/* ASSET INFO */}
              <AnimatePresence>
                {assetDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl text-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <WrenchIcon className="w-5 h-5 text-blue-600" />
                      Asset Information
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                      <p>
                        <span className="font-medium">ID:</span>{" "}
                        {assetDetails.asset_id}
                      </p>
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {assetDetails.asset_name}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span>{" "}
                        {assetDetails.category || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Model:</span>{" "}
                        {assetDetails.model || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Manufacturer:</span>{" "}
                        {assetDetails.manufacturer || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Serial:</span>{" "}
                        {assetDetails.serial_number || "—"}
                      </p>
                      <p className="capitalize">
                        <span className="font-medium">Status:</span>{" "}
                        {assetDetails.status}
                      </p>
                      <p className="capitalize">
                        <span className="font-medium">Condition:</span>{" "}
                        {assetDetails.condition}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-blue-200">
                      <span className="font-medium">Assigned To:</span>{" "}
                      {assetDetails.unit_name ? (
                        <span className="inline-flex items-center gap-1 text-blue-700">
                          <HomeIcon className="w-4 h-4" />
                          {assetDetails.unit_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <BuildingOffice2Icon className="w-4 h-4" />
                          Property-level asset
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CATEGORY */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900">
                Problem Type <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Select the category that best describes your issue
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {MAINTENANCE_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const active = selectedCategory === item.value;

                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setSelectedCategory(item.value)}
                      className={`relative p-4 flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-500 shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {active && (
                        <div className="absolute top-2 right-2">
                          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <Icon
                        className={`w-7 h-7 mb-2 ${active ? "text-blue-600" : "text-gray-500"}`}
                      />
                      <span
                        className={`text-xs sm:text-sm font-semibold text-center ${active ? "text-blue-700" : "text-gray-700"}`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900">
                Description <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Please describe the issue in detail
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 min-h-[140px] resize-none"
                placeholder="Describe what's wrong, when it started, and any other helpful details..."
              />
            </div>

            {/* EMERGENCY TOGGLE */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <div
                onClick={() => setIsEmergency(!isEmergency)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isEmergency
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isEmergency ? "bg-red-100" : "bg-gray-200"
                    }`}
                  >
                    <ExclamationTriangleIcon
                      className={`w-5 h-5 ${
                        isEmergency ? "text-red-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        isEmergency ? "text-red-700" : "text-gray-900"
                      }`}
                    >
                      Emergency Request
                    </p>
                    <p
                      className={`text-xs ${
                        isEmergency ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      Requires immediate attention (e.g., flooding, no
                      electricity)
                    </p>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${
                    isEmergency ? "bg-red-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      isEmergency ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* PHOTO UPLOAD */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <PhotoIcon className="w-4 h-4 text-gray-500" />
                Photos (optional)
              </label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Upload photos to help us understand the issue better
              </p>

              {/* Upload Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
              >
                <label className="cursor-pointer block">
                  <CloudArrowUpIcon
                    className={`w-10 h-10 mx-auto ${
                      dragActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <p className="text-sm font-medium text-gray-700 mt-2">
                    Drop photos here or{" "}
                    <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 10MB each
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Photo Previews */}
              <AnimatePresence>
                {photos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}{" "}
                        selected
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          photoPreviews.forEach((url) =>
                            URL.revokeObjectURL(url),
                          );
                          setPhotos([]);
                          setPhotoPreviews([]);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {photoPreviews.map((preview, index) => (
                        <motion.div
                          key={preview}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img
                            src={preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
                          >
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <TrashIcon className="w-4 h-4 text-white" />
                            </div>
                          </button>
                          {/* Mobile: Always show remove button */}
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center sm:hidden"
                          >
                            <XMarkIcon className="w-4 h-4 text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="p-5 sm:p-6 bg-gray-50">
              <button
                type="submit"
                disabled={
                  isSubmitting || (!!assetId && !assetDetails && loadingAsset)
                }
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                You'll receive updates on your request via email and
                notifications
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* QR SCANNER MODAL */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <QrCodeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        Scan Asset QR
                      </h3>
                      <p className="text-white/80 text-xs">
                        Point camera at QR code
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Scanner Area */}
              <div className="p-5">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                  {/* Scanner Container */}
                  <div id="qr-reader" className="qr-scanner-container" />

                  {/* Scanning Animation Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                      {/* Corner Markers */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Find the QR code label on the asset (usually on the side
                      or back)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold text-sm">
                        2
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Position the QR code within the frame and hold steady
                    </p>
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => setShowScanner(false)}
                  className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
