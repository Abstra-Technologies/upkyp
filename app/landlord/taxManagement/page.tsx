"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";
import useAuthStore from "@/zustand/authStore";
import { Upload, FileCheck } from "lucide-react";
import TaxComputationCard from "@/components/landlord/taxManagement/TaxComputationCard";

export default function LandlordTaxProfilePage() {
  const { user, fetchSession } = useAuthStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [saving, setSaving] = useState(false);

  const [taxProfile, setTaxProfile] = useState<any>({
    tin_number: "",
    registered_name: "",
    bir_branch_code: "",
    tax_type: "percentage",
    filing_type: "monthly",
    bir_certificate_url: "",
  });

  const [birFile, setBirFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) fetchSession();
    else loadTaxProfile();
  }, [user]);

  const loadTaxProfile = async () => {
    try {
      const res = await axios.get(
        `/api/landlord/taxProfile?landlord_id=${user?.landlord_id}`
      );
      if (res.data?.profile) setTaxProfile(res.data.profile);
    } catch (err) {
      console.error("Failed to fetch tax profile:", err);
    } finally {
      setIsInitialLoad(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setTaxProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!taxProfile.tin_number) {
      Swal.fire("Error", "TIN number is required.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("landlord_id", user?.landlord_id);
    formData.append("tin_number", taxProfile.tin_number);
    formData.append("registered_name", taxProfile.registered_name || "");
    formData.append("bir_branch_code", taxProfile.bir_branch_code || "");
    formData.append("tax_type", taxProfile.tax_type);
    formData.append("filing_type", taxProfile.filing_type);

    if (birFile) formData.append("bir_certificate", birFile);

    setSaving(true);
    try {
      await axios.post("/api/landlord/taxProfile", formData);
      Swal.fire("Success", "Tax profile saved successfully!", "success");
      loadTaxProfile();
      setBirFile(null); // Clear file selection after successful save
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save tax profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-3 sm:mb-4">
          <BackButton label="Back to Dashboard" />
        </div>

        {/* Skeleton Loading */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 mb-4 sm:mb-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-4 sm:mb-6">
            <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-64"></div>
          </div>

          {/* Info Alert Skeleton */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-100 rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>

          {/* Form Fields Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={i === 0 || i === 1 ? "sm:col-span-2" : ""}
              >
                <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Button Skeleton */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <div className="h-12 bg-gray-300 rounded-lg w-40"></div>
          </div>
        </div>

        {/* Tax Computation Skeleton */}
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-blue-100 animate-pulse">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-24 bg-white rounded-lg"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-24 bg-white rounded-lg"></div>
              <div className="h-24 bg-white rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      <div className="mb-3 sm:mb-4">
        <BackButton label="Back to Dashboard" />
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 mb-4 sm:mb-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
            Tax Information
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage your BIR registration details and tax filing preferences.
          </p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* TIN Number - Required */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              TIN Number <span className="text-red-500">*</span>
            </label>
            <input
              name="tin_number"
              value={taxProfile.tin_number}
              onChange={handleChange}
              placeholder="e.g., 123-456-789-000"
              className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* Registered Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Registered Name
            </label>
            <input
              name="registered_name"
              value={taxProfile.registered_name}
              onChange={handleChange}
              placeholder="e.g., Juan Dela Cruz Rentals"
              className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* BIR Branch Code */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              BIR Branch Code
            </label>
            <input
              name="bir_branch_code"
              value={taxProfile.bir_branch_code}
              onChange={handleChange}
              placeholder="e.g., 039"
              className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* Tax Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Tax Type
            </label>
            <select
              name="tax_type"
              value={taxProfile.tax_type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all bg-white"
            >
              <option value="percentage">Percentage (3%)</option>
              <option value="vat">VAT (12%)</option>
              <option value="non-vat">Non-VAT</option>
            </select>
          </div>

          {/* Filing Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Filing Type
            </label>
            <select
              name="filing_type"
              value={taxProfile.filing_type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all bg-white"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          {/* BIR Certificate Upload */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              BIR Certificate (optional)
            </label>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setBirFile(e.target.files?.[0] || null)}
                className="hidden"
                id="bir_upload"
              />
              <label
                htmlFor="bir_upload"
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                {birFile ? (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">
                      {birFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                  </>
                )}
              </label>

              {taxProfile.bir_certificate_url && (
                <a
                  href={taxProfile.bir_certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm rounded-lg transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  View Current Certificate
                </a>
              )}
            </div>

            {birFile && (
              <p className="text-[10px] sm:text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                New file selected. Click "Save" to upload.
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-sm sm:text-base shadow-md transition-all ${
              saving
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white hover:shadow-lg active:scale-[0.98]"
            }`}
          >
            {saving ? "Saving..." : "Save Tax Profile"}
          </button>
        </div>
      </div>

      {/* Tax Computation Card */}
      <TaxComputationCard
        landlordId={user?.landlord_id}
        taxType={taxProfile.tax_type}
        filingType={taxProfile.filing_type}
      />
    </div>
  );
}
