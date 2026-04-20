"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface Props {
  agreement_id: string;
}

export default function MobileLeaseInfo({ agreement_id }: Props) {
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadLease() {
      try {
        const res = await axios.get(
          "/api/tenant/activeRent/leaseAgreement/signatureStatus",
          { params: { agreement_id } }
        );
        setLease({ ...res.data, ...res.data.lease });
      } catch (err) {
        console.error("Failed to load lease:", err);
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) loadLease();
  }, [agreement_id]);

  if (loading) {
    return <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />;
  }

  if (!lease) return null;

  const signature = lease.tenant_signature ?? null;
  const isSigned = signature?.status === "signed";
  const needsSigning = signature && !isSigned;

  const startDate = lease.start_date;
  const endDate = lease.end_date;
  const hasEndDate = endDate && endDate !== "0000-00-00";

  let daysRemaining = null;
  let progressPercent = 0;
  let leaseStatus = "Active";

  if (hasEndDate && startDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
    const elapsed = Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
    daysRemaining = Math.max(Math.ceil(totalDays - elapsed), 0);
    progressPercent = Math.min((elapsed / totalDays) * 100, 100);

    if (daysRemaining <= 0) leaseStatus = "Expired";
    else if (daysRemaining <= 30) leaseStatus = "Expiring Soon";
  } else if (!hasEndDate) {
    leaseStatus = "Open";
  }

  const statusColor = leaseStatus === "Expired"
    ? "text-red-600 bg-red-50 border-red-200"
    : leaseStatus === "Expiring Soon"
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-emerald-600 bg-emerald-50 border-emerald-200";

  const barColor = leaseStatus === "Expired"
    ? "bg-red-500"
    : leaseStatus === "Expiring Soon"
      ? "bg-amber-500"
      : "bg-blue-500";

  const sendOtp = async () => {
    try {
      await axios.post("/api/tenant/activeRent/leaseAgreement/sendOtp", {
        agreement_id,
        email: signature?.email,
        role: "tenant",
      });
      setOtpSent(true);
      Swal.fire("OTP Sent", "Check your email for the code.", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.error || "Failed to send OTP", "error");
    }
  };

  const verifyOtp = async () => {
    try {
      setVerifying(true);
      const res = await axios.post(
        "/api/tenant/activeRent/leaseAgreement/verifyOtp",
        { agreement_id, email: signature?.email, otp_code: otpCode, role: "tenant" }
      );
      if (res.data?.success) {
        Swal.fire("Success", "Lease signed successfully.", "success");
        setOpenModal(false);
        setOtpSent(false);
        setOtpCode("");
      } else {
        Swal.fire("Error", res.data?.error || "Invalid OTP", "error");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700">Lease Period</span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${statusColor}`}>
            {leaseStatus}
          </span>
        </div>

        {/* Dates + Progress */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
            <p className="text-[9px] text-blue-600 uppercase font-medium">Start</p>
            <p className="text-xs font-bold">{startDate ? formatDate(startDate) : "-"}</p>
          </div>
          <div className={`rounded-lg border p-2 ${statusColor}`}>
            <p className="text-[9px] font-medium uppercase">End</p>
            <p className="text-xs font-bold">{hasEndDate ? formatDate(endDate) : "Open"}</p>
          </div>
        </div>

        {daysRemaining !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">{daysRemaining}d left</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Financials - compact cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center gap-1.5">
            <CreditCardIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Rent</p>
              <p className="text-xs font-bold">{formatCurrency(lease.rent_amount || 0)}</p>
            </div>
          </div>
          {Number(lease.security_deposit_amount) > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Deposit</p>
                <p className="text-xs font-bold">{formatCurrency(lease.security_deposit_amount)}</p>
              </div>
            </div>
          )}
          {Number(lease.advance_payment_amount) > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Advance</p>
                <p className="text-xs font-bold">{formatCurrency(lease.advance_payment_amount)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Signature */}
        {needsSigning ? (
          <div className="space-y-1.5">
            <button
              onClick={() => setOpenModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg
                bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold
                hover:from-blue-700 hover:to-blue-800 transition"
            >
              <DocumentTextIcon className="w-3.5 h-3.5" />
              View & Sign Lease
            </button>
            {Boolean(lease.agreement_url) && (
              <a
                href={lease.agreement_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <EyeIcon className="w-3 h-3" />
                View Document
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isSigned ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="text-xs text-gray-600">
                {isSigned ? "Signed" : "No signature required"}
              </span>
            </div>
            {Boolean(lease.agreement_url) && (
              <button
                onClick={() => setOpenModal(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <EyeIcon className="w-3 h-3" />
                View Document
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && Boolean(lease.agreement_url) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                Lease Agreement
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
              <iframe
                src={lease.agreement_url}
                className="w-full h-[300px] md:h-[400px] rounded-lg border"
              />

              {needsSigning && (
                <div className="space-y-2">
                  {!otpSent ? (
                    <button
                      onClick={sendOtp}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <>
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        className="w-full border p-2 rounded-lg text-center text-lg tracking-[0.3em]"
                        placeholder="••••••"
                      />
                      <button
                        onClick={verifyOtp}
                        disabled={verifying}
                        className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
                      >
                        {verifying ? "Verifying…" : "Verify & Sign"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
