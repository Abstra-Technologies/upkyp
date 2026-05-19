"use client";

// USE CASE: inner property.

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { HelpCircle, X, Clock, Copy, Check, RefreshCw, Link } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { inviteTenantTourSteps } from "@/lib/onboarding/inviteTenantTourSteps";
import LeaseConfigForm from "./LeaseConfigForm";

interface Props {
  propertyId: string | number;
  onClose: () => void;
}

interface ExistingInvite {
  id: number;
  code: string;
  status: string;
  expiresAt: string;
  startDate: string | null;
  endDate: string | null;
  timeLeft: number;
}

export default function InviteTenantModal({ propertyId, onClose }: Props) {
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [existingInvite, setExistingInvite] = useState<ExistingInvite | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const [configureLease, setConfigureLease] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [unitRent, setUnitRent] = useState<number>(0);

  const { startTour } = useOnboarding({
    tourId: "invite_tenant_modal",
    steps: inviteTenantTourSteps,
    autoStart: true,
  });

  useEffect(() => {
    if (!propertyId) return;

    async function fetchUnits() {
      setLoadingUnits(true);
      try {
        const res = await axios.get(`/api/properties/${propertyId}/units`);
        setUnits(res.data.data || []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load units.", "error");
      } finally {
        setLoadingUnits(false);
      }
    }

    fetchUnits();
  }, [propertyId]);

  const fetchExistingInvite = useCallback(async (unitId: string) => {
    if (!unitId) {
      setExistingInvite(null);
      return;
    }

    try {
      const res = await axios.get(`/api/invite?unitId=${unitId}`);
      if (res.data.exists) {
        setExistingInvite(res.data.invite);
        setTimeLeft(res.data.invite.timeLeft);
      } else {
        setExistingInvite(null);
        setTimeLeft(0);
      }
    } catch (err) {
      console.error("Failed to fetch existing invite:", err);
      setExistingInvite(null);
    }
  }, []);

  useEffect(() => {
    if (unitId && existingInvite) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setExistingInvite(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [existingInvite]);

  useEffect(() => {
    if (unitId) {
      fetchExistingInvite(unitId);
    }
  }, [unitId, fetchExistingInvite]);

  useEffect(() => {
    const selected = units.find((u) => String(u.unit_id) === String(unitId));
    if (selected) {
      setUnitRent(selected.rent_amount || 0);
    } else {
      setUnitRent(0);
    }
  }, [unitId, units]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getInviteLink = (code: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL}/tenant/join-unit?code=${code}`;
  };

  const handleCopyLink = () => {
    if (existingInvite?.code) {
      const link = getInviteLink(existingInvite.code);
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async () => {
    if (!unitId) {
      Swal.fire(
        "Missing Information",
        "Please select a unit.",
        "warning",
      );
      return;
    }

    if (configureLease) {
      if (!startDate) {
        Swal.fire(
          "Missing Start Date",
          "Please provide a start date.",
          "warning"
        );
        return;
      }
      if (endDate && new Date(startDate) >= new Date(endDate)) {
        Swal.fire(
          "Invalid Dates",
          "End date must be after start date.",
          "warning"
        );
        return;
      }
    }
    const selectedUnit = units.find(
      (u) => String(u.unit_id) === String(unitId),
    );
    if (!selectedUnit) {
      Swal.fire("Error", "Selected unit not found.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/invite/perUnit", {
        unitId,
        unitName: selectedUnit.unit_name,
        inviteMethod: "link",
        datesDeferred: !configureLease,
        startDate: configureLease ? startDate : null,
        endDate: configureLease ? endDate : null,
        rentAmount: configureLease ? rentAmount : null,
        securityDepositAmount: configureLease ? securityDeposit : null,
      });

      if (res.data.existing) {
        setExistingInvite({
          id: 0,
          code: res.data.code,
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: configureLease ? startDate : null,
          endDate: configureLease ? endDate : null,
          timeLeft: res.data.timeLeft,
        });
        setTimeLeft(res.data.timeLeft);
        
        Swal.fire(
          "Existing Invite",
          `An active invite already exists for this unit.`,
          "info",
        );
      } else {
        setExistingInvite({
          id: 0,
          code: res.data.code,
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: configureLease ? startDate : null,
          endDate: configureLease ? endDate : null,
          timeLeft: res.data.timeLeft,
        });
        setTimeLeft(res.data.timeLeft);
      }
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.response?.data?.error || "Failed to create invite link.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unitId) return;

    const selectedUnit = units.find(
      (u) => String(u.unit_id) === String(unitId),
    );

    setLoading(true);
    try {
      const res = await axios.post("/api/invite/perUnit/resend", {
        code: existingInvite?.code,
        unitId,
        unitName: selectedUnit?.unit_name || "Unit",
      });

      setExistingInvite({
          id: 0,
          code: res.data.code,
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: existingInvite?.startDate ?? null,
          endDate: existingInvite?.endDate ?? null,
          timeLeft: 600,
        });
      setTimeLeft(600);

      setCopied(false);
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.error || "Failed to regenerate invite link.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-100 bg-white">
          <button
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-10">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Invite Tenant</h2>
              <p className="text-sm text-gray-500 mt-0.5">Share a link for tenants to join</p>
            </div>
            <button
              onClick={startTour}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              Guide
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Select Unit
            </label>
            <select
              id="invite-tenant-unit"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              disabled={loadingUnits || !!existingInvite}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select a unit</option>
              {!loadingUnits &&
                units
                  .filter((u) => u.status === "unoccupied")
                  .map((unit) => (
                    <option key={unit.unit_id} value={String(unit.unit_id)}>
                      {unit.unit_name}
                    </option>
                  ))}
            </select>
            {loadingUnits && (
              <p className="text-xs text-gray-500 mt-1">Loading units...</p>
            )}
          </div>

          {!existingInvite && (
            <LeaseConfigForm
              configureLease={configureLease}
              onToggle={() => setConfigureLease((prev: boolean) => !prev)}
              startDate={startDate}
              endDate={endDate}
              rentAmount={rentAmount}
              securityDeposit={securityDeposit}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onRentAmountChange={setRentAmount}
              onSecurityDepositChange={setSecurityDeposit}
              rentFromUnit={unitRent}
            />
          )}

          {existingInvite && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Link className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Invite link created</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Share this link with your tenant. They can use it to join this unit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Expires in</span>
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white border rounded-lg mb-3">
                  <input
                    type="text"
                    readOnly
                    value={getInviteLink(existingInvite.code)}
                    className="flex-1 text-sm text-gray-600 bg-transparent outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Copy Invite Link
                    </>
                  )}
                </button>
                {copied && (
                  <p className="text-xs text-green-600 mt-2 text-center">Link copied to clipboard!</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition disabled:opacity-50 active:scale-[0.98]"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  New Link
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        {!existingInvite && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 bg-white">
            <button
              id="invite-tenant-submit"
              onClick={handleInvite}
              disabled={loading || !unitId}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600
               text-white text-sm font-semibold rounded-xl shadow-lg
               hover:from-blue-700 hover:to-emerald-700
               transition-all disabled:opacity-50 disabled:cursor-not-allowed
               active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Link...
                </span>
              ) : (
                "Create Invite Link"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              A shareable link will be generated for the tenant to join
            </p>
          </div>
        )}
      </div>
    </div>
  );
}