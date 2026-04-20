"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  Calendar,
  CreditCard,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import Swal from "sweetalert2";

const ProspectiveTenantDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unit_id");
  const tenantId = searchParams.get("tenant_id");

  const [tenant, setTenant] = useState(null);
  const [propertyName, setPropertyName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("pending");
  const [propertyId, setPropertyId] = useState(null);
  const [aiScore, setAiScore] = useState(null);

  const [isApproving, setIsApproving] = useState(false);
  const [isDisapproving, setIsDisapproving] = useState(false);

  useEffect(() => {
    if (unitId && tenantId) {
      fetchTenantDetails();
      fetchUnitDetails();
      fetchApplicationStatus();
      fetchAIScore();
    }
  }, [unitId, tenantId]);

  const fetchAIScore = async () => {
    try {
      const res = await axios.get(
        `/api/landlord/prospective/ai-screening-report?tenant_id=${tenantId}`
      );
      setAiScore(res.data);
    } catch (error) {
      console.error("Failed to fetch AI score:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const { data } = await axios.get(
        `/api/landlord/prospective/getProspecStatus?unit_id=${unitId}&tenant_id=${tenantId}`
      );
      setApplicationStatus(data.status);
    } catch (error) {
      console.error("Error fetching application status:", error);
    }
  };

  const fetchUnitDetails = async () => {
    try {
      const res = await axios.get(
        `/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`
      );
      const d = res.data?.propertyDetails;
      if (d) {
        setPropertyName(d.property_name || "");
        setUnitName(d.unit_name || "");
        setPropertyId(d.property_id || null);
      }
    } catch (err) {
      console.error("Error fetching unit details:", err);
    }
  };

  const fetchTenantDetails = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `/api/landlord/prospective/interestedTenants?tenant_id=${tenantId}`
      );
      if (data) setTenant(data);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    } finally {
      setIsLoading(false);
    }
  };

    const updateTenantStatus = async (newStatus) => {
        let disapprovalReason = null;

        try {
            if (newStatus === "approved") setIsApproving(true);
            if (newStatus === "disapproved") setIsDisapproving(true);

            // Disapproval reason prompt
            if (newStatus === "disapproved") {
                const { value } = await Swal.fire({
                    title: "Disapprove Tenant",
                    input: "textarea",
                    inputLabel: "Provide a reason for disapproval",
                    inputPlaceholder: "Type your reason here...",
                    showCancelButton: true,
                });

                if (!value) {
                    setIsDisapproving(false);
                    return;
                }
                disapprovalReason = value;
            }

            const payload = {
                unitId,
                tenant_id: tenant?.tenant_id,
                status: newStatus,
                message: disapprovalReason,
            };

            await axios.put(
                "/api/landlord/prospective/updateApplicationStatus",
                payload
            );

            setApplicationStatus(newStatus);

            // APPROVED → Ask if landlord wants to set the lease now
            if (newStatus === "approved") {
                const result = await Swal.fire({
                    icon: "success",
                    title: "Tenant Approved!",
                    text: "Would you like to set the lease now?",
                    showCancelButton: true,
                    confirmButtonText: "Yes, set lease",
                    cancelButtonText: "Not now",
                    confirmButtonColor: "#10B981",
                });

                if (result.isConfirmed) {
                    router.push(`/landlord/properties/${propertyId}/activeLease`);
                }

                return; // Stop further navigation
            }

            // Disapproved → Go back
            if (newStatus === "disapproved") {
                await Swal.fire({
                    icon: "success",
                    title: "Status Updated",
                    text: "Tenant application marked as disapproved.",
                    confirmButtonColor: "#3085d6",
                });

                router.back();
            }

        } catch (error) {
            console.error("Error updating tenant status:", error);
            Swal.fire("Error!", "Failed to update tenant status.", "error");
        } finally {
            setIsApproving(false);
            setIsDisapproving(false);
        }
    };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          {/* Header Skeleton */}
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-64 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Property Info Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-5">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* AI Score Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Info Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                      <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Scoring Values
  const rentalScore = aiScore?.rental_history_score || 0;
  const paymentScore = aiScore?.payment_history_score || 0;
  const overallScore = aiScore?.overall_score || calculateOverallScore(tenant);
  const aiSummary = aiScore?.summary || "";

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "disapproved":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "disapproved":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Tenant Screening Report
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                AI-powered analysis and applicant details
              </p>
            </div>
          </div>
        </div>

        {/* Property Info Banner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Property:</span>
                <span className="font-semibold text-gray-900">
                  {propertyName || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Unit:</span>
                <span className="font-semibold text-gray-900">
                  {unitName || "N/A"}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(
                applicationStatus
              )}`}
            >
              {getStatusIcon(applicationStatus)}
              {applicationStatus.charAt(0).toUpperCase() +
                applicationStatus.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI Scoring Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  AI Scoring Summary
                </h2>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Disclaimer:</span> This
                    report uses AI analysis as reference only. Please review
                    manually before making final decisions.
                  </p>
                </div>
              </div>

              {/* Score Bars */}
              <div className="space-y-4">
                <ScoreBar
                  label="Rental History"
                  description="Based on lease duration, renewal patterns, and consistency"
                  value={rentalScore}
                  color="emerald"
                />
                <ScoreBar
                  label="Payment Reliability"
                  description="Assessed by timeliness and consistency of past payments"
                  value={paymentScore}
                  color="blue"
                />
                <ScoreBar
                  label="Profile Completeness"
                  description="Based on submitted documents and data accuracy"
                  value={tenant ? 95 : 50}
                  color="purple"
                />
              </div>

              {/* Overall Score Card */}
              <div className="mt-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Overall Applicant Score
                    </p>
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                      {overallScore}%
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {getScoreInterpretation(overallScore)}
                    </p>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-full h-full">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        strokeWidth="10%"
                        stroke="#E5E7EB"
                        fill="none"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        strokeWidth="10%"
                        strokeLinecap="round"
                        stroke="url(#gradient)"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (overallScore / 100) * 251}
                        fill="none"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">
                      {overallScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    AI Analysis Summary
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {aiSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Applicant Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  Applicant Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={<User className="w-4 h-4" />}
                  label="Full Name"
                  value={`${tenant?.firstName || ""} ${tenant?.lastName || ""}`}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Birth Date"
                  value={formatDate(tenant?.birthDate)}
                />
                <InfoItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={tenant?.email}
                />
                <InfoItem
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={tenant?.phoneNumber}
                />
                <InfoItem
                  icon={<MapPin className="w-4 h-4" />}
                  label="Address"
                  value={tenant?.address}
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  Submitted Documents
                </h2>
              </div>

              {tenant?.valid_id || tenant?.proof_of_income ? (
                <div className="space-y-3">
                  {tenant?.valid_id && (
                    <DocumentLink
                      label="Government ID"
                      href={tenant.valid_id}
                      icon={<CreditCard className="w-5 h-5" />}
                    />
                  )}
                  {tenant?.proof_of_income && (
                    <DocumentLink
                      label="Proof of Income"
                      href={tenant.proof_of_income}
                      icon={<Briefcase className="w-5 h-5" />}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  <p>No documents submitted yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Decision Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 sticky top-6">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                Application Decision
              </h2>

              {applicationStatus === "pending" && (
                <div className="space-y-3">
                  <button
                    onClick={() => updateTenantStatus("approved")}
                    disabled={isApproving || isDisapproving}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm 
        ${
          isApproving
            ? "bg-emerald-400 cursor-not-allowed text-white"
            : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
        }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isApproving ? "Approving..." : "Approve Tenant"}
                  </button>

                  <button
                    onClick={() => updateTenantStatus("disapproved")}
                    disabled={isApproving || isDisapproving}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm 
        ${
          isDisapproving
            ? "bg-red-400 cursor-not-allowed text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {isDisapproving ? "Rejecting..." : "Reject Application"}
                  </button>
                </div>
              )}

              {applicationStatus === "approved" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900 mb-1">
                        Application Approved
                      </h3>
                      <p className="text-sm text-emerald-700">
                        This tenant has been approved for this unit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {applicationStatus === "disapproved" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">
                        Application Rejected
                      </h3>
                      <p className="text-sm text-red-700">
                        This tenant's application has been rejected.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Helper Components */
const ScoreBar = ({ label, description, value, color = "blue" }) => {
  const colorMap = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <span className="text-sm font-bold text-gray-700">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${colorMap[color]} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
};

const InfoItem = ({ icon, label, value, className = "" }) => (
  <div className={className}>
    <div className="flex items-center gap-2 mb-1">
      <div className="text-gray-400">{icon}</div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
    <p className="text-sm font-semibold text-gray-900 ml-6">
      {value || "Not provided"}
    </p>
  </div>
);

const DocumentLink = ({ icon, label, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
        {label}
      </span>
    </div>
    <FileText className="w-4 h-4 text-blue-600" />
  </a>
);

const calculateOverallScore = (tenant) => {
  let score = 0;
  if (tenant?.valid_id) score += 25;
  if (tenant?.proof_of_income) score += 25;
  if (tenant?.employment_type) score += 25;
  if (tenant?.monthly_income) score += 25;
  return score;
};

const getScoreInterpretation = (score) => {
  if (score >= 90) return "A+ Excellent Applicant";
  if (score >= 80) return "A Good Applicant";
  if (score >= 70) return "B Fair Standing";
  if (score >= 60) return "C Below Average";
  return "D Needs Improvement";
};

export default ProspectiveTenantDetails;
