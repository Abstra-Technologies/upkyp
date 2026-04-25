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

    if (existingInvite) {
      const confirm = await Swal.fire({
        title: "Active Invite Found",
        text: "There is already an active invite for this unit. Generating a new code will delete the existing one. Continue?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, Generate New Code",
      });

      if (!confirm.isConfirmed) return;

      setLoading(true);
      try {
        const res = await axios.post("/api/invite/perUnit/regenerate", {
          unitId,
          existingInviteId: existingInvite.id,
        });

        const newInvite = {
          code: res.data.code,
          expiresAt: new Date(res.data.expiresAt),
          email: inviteMethod === "email" ? email : null,
        };

        setInviteResult(newInvite);
        setExistingInvite({
          id: res.data.inviteId,
          code: res.data.code,
          email: inviteMethod === "email" ? email : "",
          status: "PENDING",
          expiresAt: res.data.expiresAt,
          startDate: setDatesNow ? startDate : null,
          endDate: setDatesNow ? endDate : null,
          timeLeft: res.data.timeLeft,
        });
        setTimeLeft(res.data.timeLeft);
        setCopied(false);

        onInviteSent?.();
      } catch (err: any) {
        Swal.fire(
          "Error",
          err?.response?.data?.error || "Failed to generate new code.",
          "error"
        );
      } finally {
        setLoading(false);
      }
      return;
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

  const handleGenerateNewCode = async () => {
    const confirm = await Swal.fire({
      title: "Generate New Code?",
      text: "This will invalidate the existing invite code. The tenant will no longer be able to use the old code.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Generate New Code",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/invite/perUnit/regenerate", {
        unitId,
        existingInviteId: existingInvite?.id,
      });

      const newInvite = {
        code: res.data.code,
        expiresAt: new Date(res.data.expiresAt),
        email: res.data.email || "",
      };

      setInviteResult(newInvite);
      setExistingInvite({
        id: res.data.inviteId,
        code: res.data.code,
        email: res.data.email || "",
        status: "PENDING",
        expiresAt: res.data.expiresAt,
        startDate: existingInvite?.startDate || null,
        endDate: existingInvite?.endDate || null,
        timeLeft: res.data.timeLeft,
      });
      setTimeLeft(res.data.timeLeft);
      setCopied(false);

      Swal.fire("Success", "New invite code generated successfully.", "success");
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.error || "Failed to generate new code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-auto overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Invite Tenant</h2>
            <p className="text-xs text-white/80 truncate">Unit: {unitName}</p>
          </div>
          <button
            className="p-2 hover:bg-white/20 rounded-xl transition"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {existingInvite || inviteResult ? (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 rounded-full mb-4">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-3xl font-bold text-amber-700 tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <p className="text-sm text-gray-500">Expires in</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center mb-3">Invite Code</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                  {formatCode(activeCode).split(" ").map((char, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-14 sm:w-16 sm:h-16 bg-white border-2 border-blue-500 rounded-xl flex items-center justify-center shadow-sm"
                    >
                      <span className="text-2xl sm:text-3xl font-bold text-blue-600">{char}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition active:scale-95"
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
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateNewCode}
                  disabled={loading}
                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  New Code
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setInviteMethod("email")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition ${
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
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition ${
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
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tenant Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenant@email.com"
                    className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              )}

              {inviteMethod === "code" && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Generate a shareable 4-character code that expires in 10 minutes.
                  </p>
                </div>
              )}

              {inviteMethod === "email" && (
                <div className="p-3 rounded-xl border bg-gray-50">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setDatesNow}
                      onChange={() => setSetDatesNow((prev) => !prev)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Set lease dates now
                  </label>
                </div>
              )}

              {setDatesNow && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Lease Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Lease End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95"
              >
                {loading
                  ? "Sending..."
                  : inviteMethod === "email"
                  ? "Send Invitation"
                  : "Generate Code"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}