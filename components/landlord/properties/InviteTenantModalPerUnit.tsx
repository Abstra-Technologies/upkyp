"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Mail, Copy, Check, Clock, X, RefreshCw } from "lucide-react";

interface InviteTenantModalPerUnitProps {
  unitId: string | number;
  unitName: string;
  onClose: () => void;
  onInviteSent?: () => void;
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

export default function InviteTenantModalPerUnit({
  unitId,
  unitName,
  onClose,
  onInviteSent,
}: InviteTenantModalPerUnitProps) {
  const [email, setEmail] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [existingInvite, setExistingInvite] = useState<ExistingInvite | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    code: string;
    expiresAt: Date;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [setDatesNow, setSetDatesNow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchExistingInvite = useCallback(async () => {
    try {
      const res = await axios.get(`/api/invite?unitId=${unitId}`);
      if (res.data.exists) {
        setExistingInvite(res.data.invite);
        setTimeLeft(res.data.invite.timeLeft);
      }
    } catch (err) {
      console.error("Failed to fetch existing invite:", err);
    }
  }, [unitId]);

  useEffect(() => {
    fetchExistingInvite();
  }, [fetchExistingInvite]);

  const calculateTimeLeft = useCallback(() => {
    if (!existingInvite?.expiresAt && !inviteResult?.expiresAt) return 0;
    const expiresAt = existingInvite?.expiresAt 
      ? new Date(existingInvite.expiresAt) 
      : inviteResult!.expiresAt;
    const now = new Date();
    const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    return diff > 0 ? diff : 0;
  }, [existingInvite?.expiresAt, inviteResult?.expiresAt]);

  useEffect(() => {
    const remaining = calculateTimeLeft();
    if (remaining > 0) {
      setTimeLeft(remaining);
      const timer = setInterval(() => {
        const newRemaining = calculateTimeLeft();
        setTimeLeft(newRemaining);
        if (newRemaining <= 0) {
          clearInterval(timer);
          setExistingInvite(null);
          setInviteResult(null);
          Swal.fire("Expired", "The invite code has expired.", "warning");
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [existingInvite, inviteResult, calculateTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCode = (code: string) => {
    return code.match(/.{1,2}/g)?.join(" ") || code;
  };

  const activeCode = existingInvite?.code || inviteResult?.code || "";

  const handleCopyCode = () => {
    if (activeCode) {
      navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async () => {
    if (inviteMethod === "email" && !email) {
      Swal.fire("Missing Email", "Please enter tenant email.", "warning");
      return;
    }

    if (inviteMethod === "email" && setDatesNow) {
      if (!startDate || !endDate) {
        Swal.fire("Missing Dates", "Please provide both start and end dates.", "warning");
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        Swal.fire("Invalid Dates", "End date must be after start date.", "warning");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        unitId,
        unitName,
        inviteMethod: inviteMethod,
        datesDeferred: !setDatesNow,
      };

      if (inviteMethod === "email") {
        payload.email = email;
        payload.startDate = setDatesNow ? startDate : null;
        payload.endDate = setDatesNow ? endDate : null;
      }

      const res = await axios.post("/api/invite/perUnit", payload);
      
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
      } else {
        setInviteResult({
          code: res.data.code,
          expiresAt: new Date(res.data.expiresAt),
          email: res.data.email || "",
        });
      }
      
      onInviteSent?.();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.response?.data?.error || "Failed to send invite.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!activeCode) return;
    
    setLoading(true);
    try {
      const res = await axios.post("/api/invite/perUnit/resend", {
        code: activeCode,
        unitId,
        unitName,
      });
      
      const newInvite = {
        code: res.data.code,
        expiresAt: new Date(res.data.expiresAt),
        email: res.data.email || "",
      };
      
      setInviteResult(newInvite);
      setExistingInvite({
        id: 0,
        code: res.data.code,
        email: res.data.email || "",
        status: "PENDING",
        expiresAt: res.data.expiresAt,
        startDate: existingInvite?.startDate || null,
        endDate: existingInvite?.endDate || null,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Invite Tenant
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Unit: <span className="font-medium">{unitName}</span>
        </p>

        {existingInvite ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">
                Active invite found for this unit
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Sent to: {existingInvite.email || "Code share"}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Invite Code</span>
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-3">
                {formatCode(existingInvite.code).split(" ").map((char, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-14 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-blue-600">{char}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

            <div className="flex gap-2">
              <button
                onClick={handleResend}
                disabled={loading}
                className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                New Code
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : inviteResult ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-emerald-800">
                {inviteMethod === "email" ? "Invitation Sent!" : "Code Generated!"}
              </p>
              <p className="text-sm text-emerald-600">
                {inviteMethod === "email" 
                  ? `Invite sent to ${inviteResult.email}` 
                  : "Share this code with the tenant"}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Invite Code</span>
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-3">
                {formatCode(inviteResult.code).split(" ").map((char, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-14 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-blue-600">{char}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

            <div className="flex gap-2">
              <button
                onClick={handleResend}
                disabled={loading}
                className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                New Code
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInviteMethod("email")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  inviteMethod === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Mail className="inline w-4 h-4 mr-1.5" />
                Email
              </button>
              <button
                onClick={() => setInviteMethod("code")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  inviteMethod === "code"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Copy className="inline w-4 h-4 mr-1.5" />
                Share Code
              </button>
            </div>

            {inviteMethod === "email" && (
              <>
                <label className="text-sm font-medium text-gray-700">
                  Tenant Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@email.com"
                  className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                />
              </>
            )}

            {inviteMethod === "code" && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  Generate a shareable 4-character code that expires in 10 minutes. 
                  The tenant can use this code to accept the invitation.
                </p>
              </div>
            )}

            {inviteMethod === "email" && (
              <div className="mb-4 p-3 rounded-lg border bg-gray-50">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={setDatesNow}
                    onChange={() => setSetDatesNow((prev) => !prev)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Set lease dates now
                </label>
              </div>
            )}

            {setDatesNow && (
              <>
                <label className="text-sm font-medium text-gray-700">
                  Lease Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 mb-3 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                />

                <label className="text-sm font-medium text-gray-700">
                  Lease End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                />
              </>
            )}

            <button
              onClick={handleInvite}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600
                           text-white font-semibold rounded-lg shadow-md
                           hover:from-blue-700 hover:to-emerald-700
                           transition-all disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : inviteMethod === "email"
                ? "Send Invitation"
                : "Generate Code"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}