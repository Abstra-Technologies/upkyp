"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Upload, FileText, Building2, Landmark, AlertCircle, CheckCircle2, Clock, ArrowLeft, Info, Receipt } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const DOC_TYPES = [
  { value: "business_permit", label: "Mayor's/Business Permit", icon: FileText, desc: "Issued by your local city/municipality" },
  { value: "occupancy_permit", label: "Occupancy Permit", icon: Building2, desc: "Certificate of occupancy from LGU" },
  { value: "property_title", label: "Property Title (TCT/OCT)", icon: Landmark, desc: "Title from Registry of Deeds" },
];

export default function PropertyVerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();
  const propertyId = id as string;


  const [selectedDoc, setSelectedDoc] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: verificationData, mutate } = useSWR(
    propertyId ? `/api/landlord/properties/docs/${propertyId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  const currentVerification = verificationData?.[0];
  const verificationStatus = currentVerification?.status || null;
  const adminMessage = currentVerification?.admin_message;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDocFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedDoc) {
      Swal.fire("Required", "Please select a document type.", "warning");
      return;
    }
    if (!tinNumber.trim()) {
      Swal.fire("Required", "Please enter your TIN number.", "warning");
      return;
    }
    if (!docFile) {
      Swal.fire("Required", "Please upload your business document.", "warning");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("property_id", propertyId);
      formData.append("docType", selectedDoc);
      formData.append("tinNumber", tinNumber.trim());
      formData.append("submittedDoc", docFile);

      await axios.post("/api/propertyListing/propertyVerification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Submitted!",
        text: "Your documents have been submitted for verification.",
        confirmButtonColor: "#10b981",
      });

      mutate();
      setDocFile(null);
      setTinNumber("");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.error || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-none bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Property Verification</h1>
            <p className="text-xs text-gray-500">Submit documents to verify your property</p>
          </div>
        </div>

        {/* Status Banner */}
        {verificationStatus && (
          <div className={`mb-6 p-4 rounded-xl border ${
            verificationStatus === "Verified" ? "bg-emerald-50 border-emerald-200" :
            verificationStatus === "Rejected" ? "bg-red-50 border-red-200" :
            "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                verificationStatus === "Verified" ? "bg-emerald-100" :
                verificationStatus === "Rejected" ? "bg-red-100" :
                "bg-amber-100"
              }`}>
                {verificationStatus === "Verified" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                 verificationStatus === "Rejected" ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                 <Clock className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${
                  verificationStatus === "Verified" ? "text-emerald-800" :
                  verificationStatus === "Rejected" ? "text-red-800" :
                  "text-amber-800"
                }`}>
                  {verificationStatus === "Verified" ? "Property Verified" :
                   verificationStatus === "Rejected" ? "Verification Rejected" :
                   "Under Review"}
                </p>
                {adminMessage && (
                  <p className="text-xs text-gray-600 mt-1">{adminMessage}</p>
                )}
                {verificationStatus === "Verified" && (
                  <p className="text-xs text-emerald-700 mt-1">You can now publish units for this property.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Document Type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-1">Step 1: Choose Document Type</h2>
          <p className="text-xs text-gray-500 mb-4">Upload any ONE of the following business documents</p>

          <div className="space-y-2">
            {DOC_TYPES.map((doc) => {
              const Icon = doc.icon;
              return (
                <button
                  key={doc.value}
                  onClick={() => setSelectedDoc(doc.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedDoc === doc.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedDoc === doc.value ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Icon className={`w-5 h-5 ${selectedDoc === doc.value ? "text-blue-600" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${selectedDoc === doc.value ? "text-blue-800" : "text-gray-900"}`}>{doc.label}</p>
                    <p className="text-[11px] text-gray-500">{doc.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedDoc === doc.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}>
                    {selectedDoc === doc.value && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: TIN Number */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-1">Step 2: TIN Number</h2>
          <p className="text-xs text-gray-500 mb-4">Enter your Tax Identification Number</p>

          <div className="relative">
            <Receipt className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
              placeholder="000-000-000-000"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Step 3: Upload Document */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-1">Step 3: Upload Document</h2>
          <p className="text-xs text-gray-500 mb-4">Upload a clear photo or PDF of your selected document</p>

          <label className={`flex flex-col items-center justify-center gap-3 w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            docFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            {docFile ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-emerald-700">{docFile.name}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{(docFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, or PDF (max 10MB)</p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Info Note */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800">Important</p>
              <p className="text-xs text-blue-700 mt-0.5">Verification usually takes 1-3 business days. You will be notified once your property is verified. Verified properties can publish units to the rental marketplace.</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Submit for Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
}
