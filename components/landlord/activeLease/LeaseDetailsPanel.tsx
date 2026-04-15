"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  X,
  FileText,
  Calendar,
  User,
  Building2,
  FileDown,
  AlertCircle,
  Mail,
  Phone,
  FileCog,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";

export default function LeaseDetailsPanel({ lease, onClose }) {
  const router = useRouter();
  const [signatures, setSignatures] = useState<any[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  if (!lease) return null;

  const hasAgreement = !!lease.agreement_url;
  const pdfUrl = lease.agreement_url;
  const signedCount = signatures.filter((s) => s.status === "signed").length;
  const totalCount = 2;
  const signatureProgress = Math.round((signedCount / totalCount) * 100);

  useEffect(() => {
    setSignatures([]);
    setTrackingEnabled(false);

    if (!lease?.lease_id) return;

    axios
      .get(
        `/api/landlord/activeLease/signatureTracking?agreement_id=${lease.lease_id}`
      )
      .then((res) => {
        const data = res.data;
        const sigs =
          data && Array.isArray(data.signatures) ? data.signatures : [];
        setSignatures(sigs);
        setTrackingEnabled(Boolean(data.tracking_enabled));
      })
      .catch((err) => console.error("Failed to fetch signatures", err));
  }, [lease?.lease_id]);

  const isDraftWithNoDocument = lease.lease_status === "draft" && !hasAgreement;
  const isDraft = lease.lease_status === "draft";

  const handleSetupLeaseRedirect = () => {
    const agreementId = lease.agreement_id || lease.lease_id;
    router.push(
      `/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
    );
  };

  const handleViewLeaseRedirect = () => {
    const agreementId = lease.agreement_id || lease.lease_id;
    if (lease.lease_status === "draft") {
      router.push(
        `/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
      );
    } else {
      router.push(
        `/landlord/properties/${lease.property_id}/activeLease/leaseDetails/${agreementId}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="flex flex-col w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[85vh] md:max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-white flex-shrink-0" />
            <h2 className="text-base font-bold text-white truncate">Lease Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors flex-shrink-0"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Lease ID
                </p>
                <p className="text-sm font-semibold text-gray-900 break-all">
                  {lease.lease_id || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Unit</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lease.unit_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Tenant</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lease.tenant_name}
                  </p>
                </div>
              </div>

              {lease.tenant_email && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Email
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-900 truncate">
                      {lease.tenant_email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {lease.tenant_phone && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-900">{lease.tenant_phone}</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Lease Period
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-900 truncate">
                    {lease.start_date ? formatDate(lease.start_date) : "N/A"}
                  </p>
                </div>
                <span className="text-gray-400 flex-shrink-0">→</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-900 truncate">
                    {lease.end_date ? formatDate(lease.end_date) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Agreement Document
              </p>
              {hasAgreement ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors border border-blue-200 w-full justify-center"
                >
                  <FileDown className="w-4 h-4" />
                  View Document
                </a>
              ) : (
                  <div className="flex items-center justify-between flex-wrap gap-2 bg-gray-50 border border-gray-200 p-3 rounded-lg">

                      {/* Left: Icon + Text */}
                      <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                              No agreement uploaded yet.
                          </p>
                      </div>

                      {/* Right: Button */}
                      <button
                          onClick={handleSetupLeaseRedirect}
                          className="inline-flex items-center gap-1 bg-gray-400 hover:bg-gray-500 text-white text-[11px] sm:text-xs font-medium px-2.5 py-1.5 rounded-md transition-all flex-shrink-0"
                      >
                          <FileCog className="w-3 h-3" />
                          Setup/Upload Lease
                      </button>

                  </div>
              )}
            </div>

            {Array.isArray(signatures) &&
              signatures.length === 2 &&
              trackingEnabled && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Signature Progress
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        signatureProgress === 100
                          ? "bg-gradient-to-r from-emerald-500 to-green-600"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                      style={{ width: `${signatureProgress}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    {signatureProgress === 100
                      ? "Both parties have signed the lease."
                      : `${signatureProgress}% completed — ${2 - signedCount} ${
                          2 - signedCount > 1 ? "parties" : "party"
                        } remaining.`}
                  </p>

                  <div className="space-y-2">
                    {signatures.map((sig) => (
                      <div
                        key={sig.id ?? sig.role}
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                          sig.status === "signed"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold capitalize">
                            {sig.role}
                          </span>
                          {sig.email && (
                            <span className="text-xs text-gray-500 truncate">
                              {sig.email}
                            </span>
                          )}
                        </div>

                        <span className="text-xs ml-2 flex-shrink-0">
                          {sig.status === "signed"
                            ? `Signed ${
                                sig.signed_at
                                  ? new Date(sig.signed_at).toLocaleDateString()
                                  : ""
                              }`
                            : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0 flex justify-center">
          {isDraftWithNoDocument ? (
            <button
              onClick={handleSetupLeaseRedirect}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium text-xs transition-all"
            >
              <FileCog className="w-3.5 h-3.5" />
              Setup Lease Agreement
            </button>
          ) : (
            <button
              onClick={handleViewLeaseRedirect}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              {isDraft ? "Continue Setup" : "View Lease Detailed Info"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
