"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { HelpCircle, X, Clock, Copy, Check, RefreshCw } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { inviteTenantTourSteps } from "@/lib/onboarding/inviteTenantTourSteps";

interface Props {
  propertyId: string | number;
  onClose: () => void;
}

interface ExistingInvite {
  id: number;
  code: string;
  email: string;
  status: string;
  expiresAt: string;
  startDate: string | null;
  endDate: string | null;
  timeLeft: number;
}

export default function InviteTenantModal({ propertyId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [existingInvite, setExistingInvite] = useState<ExistingInvite | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const [setDatesNow, setSetDatesNow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCode = (code: string) => {
    return code.match(/.{1,2}/g)?.join(" ") || code;
  };

  const handleCopyCode = () => {
    if (existingInvite?.code) {
      navigator.clipboard.writeText(existingInvite.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async () => {
    if (!email || !unitId) {
      Swal.fire(
        "Missing Information",
        "Tenant email and unit are required.",
        "warning",
      );
      return;
    }

    if (setDatesNow) {
      if (!startDate || !endDate) {
        Swal.fire(
          "Missing Dates",
          "Please provide both start and end dates.",
          "warning",
        );
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        Swal.fire(
          "Invalid Dates",
          "End date must be after start date.",
          "warning",
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
      const res = await axios.post("/api/invite", {
        email,
        unitId,
        unitName: selectedUnit.unit_name,
        datesDeferred: !setDatesNow,
        startDate: setDatesNow ? startDate : null,
        endDate: setDatesNow ? endDate : null,
      });

      if (res.data.existing) {
        setExistingInvite({
          id: 0,
          code: res.data.code,
          email: email,
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: setDatesNow ? startDate : null,
          endDate: setDatesNow ? endDate : null,
          timeLeft: res.data.timeLeft,
        });
        setTimeLeft(res.data.timeLeft);
        
        Swal.fire(
          "Existing Invite",
          `An active invite already exists for this unit. Code: ${res.data.code}`,
          "info",
        );
      } else {
        Swal.fire(
          "Invitation Sent",
          "The tenant has been invited successfully.",
          "success",
        );
        onClose();
      }
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.response?.data?.error || "Failed to send invite.",
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
          email: existingInvite?.email || "",
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: existingInvite?.startDate ?? null,
          endDate: existingInvite?.endDate ?? null,
          timeLeft: 600,
        });
      setTimeLeft(600);

      setCopied(false);
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.error || "Failed to resend invite.", "error");
    } finally {
      setLoading(false);
    }
  };

return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-md relative max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 px-3 py-3 border-b border-gray-100 bg-white">
                    <button
                        className="absolute top-2 right-2 p-2 -m-2 text-gray-400 hover:text-gray-600 z-10 touch-manipulation"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center justify-between pr-10">
                        <h2 className="text-base font-semibold text-gray-800">Invite Tenant</h2>
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
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                    {existingInvite ? (
                        <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-sm text-amber-800 font-medium">
                                    Active invite found for this unit
                                </p>
                                <p className="text-xs text-amber-600 mt-1 break-all">
                                    Sent to: {existingInvite.email}
                                </p>
                            </div>

                            <div className="bg-gray-50 border rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Invite Code</span>
                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
                                    </div>
                                </div>

                                {/* Code display */}
                                <div className="flex items-center justify-center gap-1.5 mb-3">
                                    {formatCode(existingInvite.code).split("").map((char, idx) => (
                                        <div
                                            key={idx}
                                            className="w-10 h-12 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center"
                                        >
                                            <span className="text-xl font-bold text-blue-600">
                                                {char}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCopyCode}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition active:scale-[0.98] touch-manipulation"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy Code
                                        </>
                                    )}
                                </button>
                                {copied && (
                                    <p className="text-xs text-green-600 mt-2 text-center">Code copied to clipboard!</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="flex-1 py-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-200 transition disabled:opacity-50 active:scale-[0.98] touch-manipulation"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    New Code
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-blue-600 text-white text-base font-medium rounded-xl hover:bg-blue-700 transition active:scale-[0.98] touch-manipulation"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                    Tenant Email
                                </label>
                                <input
                                    id="invite-tenant-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tenant@email.com"
                                    inputMode="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                    Select Unit
                                </label>
                                <select
                                    id="invite-tenant-unit"
                                    value={unitId}
                                    onChange={(e) => setUnitId(e.target.value)}
                                    disabled={loadingUnits}
                                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4 disabled:bg-gray-50 disabled:text-gray-500"
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
                                    <p className="text-xs text-gray-500 -mt-3 mb-4">Loading units...</p>
                                )}
                            </div>

                            <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50">
                                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={setDatesNow}
                                        onChange={() => setSetDatesNow((prev) => !prev)}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                    />
                                    <span>Set lease dates now</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-2 ml-8">
                                    You can also set lease dates later during agreement setup.
                                </p>
                            </div>

                            {setDatesNow && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Lease Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Lease End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate || new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                {!existingInvite && (
                    <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100 bg-white">
                        <button
                            id="invite-tenant-submit"
                            onClick={handleInvite}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600
                     text-white text-sm font-semibold rounded-xl shadow-lg
                     hover:from-blue-700 hover:to-emerald-700
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] touch-manipulation"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                "Send Invitation"
                            )}
                        </button>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            An email with a 4-digit code will be sent to the tenant
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}