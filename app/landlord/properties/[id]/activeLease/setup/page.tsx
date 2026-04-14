"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FileUp,
  FileEdit,
  ArrowLeft,
  Loader2,
  FileText,
  FileCheck,
  Upload,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";
import GenerateLease from "./GenerateLease";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  leaseSetupSteps,
  leaseUploadSteps,
} from "@/lib/onboarding/leaseSetupMode";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function SetupLeasePage() {
  const router = useRouter();
  const params = useParams();
  const property_id = params.id as string;
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id");

  const [leaseDetails, setLeaseDetails] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMode, setSelectedMode] = useState<
    "upload" | "generate" | null
  >(null);
  const STORAGE_KEY = `lease_setup_${agreement_id}`;

  // Onboarding for Step 1 (mode selection)
  const { startTour: startSetupTour } = useOnboarding({
    tourId: "lease-setup-mode",
    steps: leaseSetupSteps,
    autoStart: true,
  });

  // Onboarding for Step 2 Upload flow
  const { startTour: startUploadTour } = useOnboarding({
    tourId: "lease-upload-form",
    steps: leaseUploadSteps,
    autoStart: false,
  });

  // Auto-start upload tour when entering Step 2 with upload mode
  useEffect(() => {
    if (step === 2 && selectedMode === "upload") {
      const hasSeenUploadTour = localStorage.getItem(
        "onboarding_lease-upload-form",
      );
      if (!hasSeenUploadTour) {
        const timer = setTimeout(() => {
          startUploadTour();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [step, selectedMode, startUploadTour]);

  useEffect(() => {
    if (!agreement_id) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed.step) setStep(parsed.step);
      if (parsed.selectedMode) setSelectedMode(parsed.selectedMode);
    }
  }, [agreement_id]);

  useEffect(() => {
    if (!agreement_id) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step,
        selectedMode,
      }),
    );
  }, [step, selectedMode, agreement_id]);

  useEffect(() => {
    if (!agreement_id) return;
    const fetchLeaseDetails = async () => {
      try {
        const res = await axios.get(
          `/api/landlord/activeLease/getByAgreementId`,
          {
            params: { agreement_id },
          },
        );
        setLeaseDetails(res.data || {});
      } catch (error) {
        Swal.fire("Error", "Failed to load lease details.", "error");
      }
    };
    fetchLeaseDetails();
  }, [agreement_id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      Swal.fire(
        "File too large",
        "Lease document must be 10MB or smaller.",
        "error",
      );
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  // only for upload setup only.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      Swal.fire(
        "Missing File",
        "Please upload the lease agreement document.",
        "warning",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      Swal.fire(
        "File too large",
        "Lease document must be 10MB or smaller.",
        "error",
      );
      return;
    }

    const formData = new FormData(e.currentTarget);

    formData.append("agreement_id", agreement_id!);
    formData.append("property_id", property_id as string);
    formData.append("lease_file", file);

    if (leaseDetails) {
      formData.append("tenant_id", leaseDetails.tenant_id);
      formData.append("landlord_id", leaseDetails.landlord_id);
    }

    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    if (!start_date) {
      Swal.fire(
        "Incomplete",
        "Please provide lease start and end dates.",
        "warning",
      );
      return;
    }

    setIsUploading(true);
    try {
      const res = await axios.post(
        `/api/landlord/activeLease/uploadLease`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      Swal.fire({
        title: "Success",
        text: "Lease document and details uploaded successfully!",
        icon: "success",
        confirmButtonColor: "#059669",
      });

      // Redirect to active lease view
      router.push(`/pages/landlord/properties/${property_id}/activeLease`);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errMsg =
        error.response?.data?.message ||
        "There was a problem uploading the lease document. Please try again later.";
      Swal.fire("Upload Failed", errMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Determine which tour to start based on current step
  const handleShowGuide = () => {
    if (step === 1) {
      startSetupTour();
    } else if (step === 2 && selectedMode === "upload") {
      startUploadTour();
    }
    // Note: Generate mode has its own guide button in GenerateLease component
  };

  return (
    <div className="min-h-screen h-full bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Setup Lease Agreement
          </h1>
        </div>

        {/* Only show guide button for Step 1 and Upload mode */}
        {(step === 1 || (step === 2 && selectedMode === "upload")) && (
          <button
            onClick={handleShowGuide}
            className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Show Guide</span>
          </button>
        )}
      </div>

      {/* Main Content - Flex grow to fill remaining space */}
      <div className="flex-1 flex flex-col">
        {/* Step 1: Choose Mode */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Step 1: Choose how to set up your lease
            </h2>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
              You can either upload an existing signed document or generate a
              new one using UpKyp's guided system.
            </p>

            <div
              id="mode-selection"
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-8"
            >
              {/* Upload Option */}
              <div
                id="upload-option"
                onClick={() => setSelectedMode("upload")}
                className={`cursor-pointer rounded-2xl border-2 p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                  selectedMode === "upload"
                    ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <FileUp
                  className={`w-12 h-12 mb-4 ${
                    selectedMode === "upload"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                  Upload Existing Lease
                </h3>
                <p className="text-sm text-gray-500">
                  If you already have a signed agreement, upload it here.
                </p>
              </div>

              {/* Generate Option */}
              <div
                id="generate-option"
                onClick={() => setSelectedMode("generate")}
                className={`cursor-pointer rounded-2xl border-2 p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                  selectedMode === "generate"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <FileEdit
                  className={`w-12 h-12 mb-4 ${
                    selectedMode === "generate"
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                />
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                  Generate Lease
                </h3>
                <p className="text-sm text-gray-500">
                  Use UpKyp's guided generator to create a new lease.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedMode}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 - Upload only */}
        {step === 2 && selectedMode === "upload" && (
          <div className="flex-1">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Upload Lease
                Document
              </h2>

              {/* Lease Info Summary */}
              <div
                id="tenant-info-summary"
                className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl"
              >
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" /> Tenant &
                  Lease Information
                </h3>
                {leaseDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <p>
                      <span className="font-medium text-gray-800">Tenant:</span>{" "}
                      {leaseDetails.tenant_name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Email:</span>{" "}
                      {leaseDetails.tenant_email || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Unit:</span>{" "}
                      {leaseDetails.unit_name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">
                        Property:
                      </span>{" "}
                      {leaseDetails.property_name || "N/A"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading tenant details...
                  </div>
                )}
              </div>

              {/* Editable Lease Fields */}
              <div
                id="lease-dates"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease End Date{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div
                id="financial-details"
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="rent_amount"
                    min="0"
                    step="0.01"
                    defaultValue={leaseDetails?.rent_amount || ""}
                    required
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit (₱)
                  </label>
                  <input
                    type="number"
                    name="security_deposit"
                    min="0"
                    step="0.01"
                    defaultValue={leaseDetails?.security_deposit || ""}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advance Payment (₱)
                  </label>
                  <input
                    type="number"
                    name="advance_payment"
                    min="0"
                    step="0.01"
                    defaultValue={leaseDetails?.advance_payment || ""}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div id="file-upload-area" className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Document <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all">
                    <div className="flex flex-col items-center justify-center text-gray-600 p-4">
                      <Upload className="w-10 h-10 text-blue-500 mb-3" />
                      <span className="text-sm font-medium text-center">
                        {file ? file.name : "Click to upload or drag file here"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PDF or DOCX (max 10MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:w-48">
                      <FileCheck className="w-8 h-8 text-emerald-600 mb-2" />
                      <p className="text-sm font-medium text-gray-700 text-center break-all">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Page footer Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition text-sm font-medium border border-gray-200"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Selection
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" /> Submit Agreement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && selectedMode === "generate" && (
          <div className="flex-1">
            <GenerateLease
              property_id={property_id}
              agreement_id={agreement_id}
              leaseDetails={leaseDetails}
            />
          </div>
        )}
      </div>
    </div>
  );
}
