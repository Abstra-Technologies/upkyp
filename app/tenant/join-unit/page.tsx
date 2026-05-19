"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { Home, Clock, AlertCircle, CheckCircle, ArrowRight, Building2 } from "lucide-react";

interface InviteData {
  id: number;
  unitId: string;
  email: string | null;
  expiresAt: string;
  unit_name: string;
  property_id: string;
  property_name: string;
  property_photo: string | null;
}

export default function JoinUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!code) {
      setError("No invite code provided");
      setLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await axios.get(`/api/invite/${code}`);
        setInvite(res.data.invite);
        
        const expiresAt = new Date(res.data.invite.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
      } catch (err: any) {
        if (err.response?.status === 410) {
          setError("This invite link has expired");
        } else if (err.response?.status === 404) {
          setError("This invite link is invalid");
        } else {
          setError("Failed to load invite details");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [code]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError("This invite link has expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await axios.post("/api/invite/accept", {
        inviteCode: code,
      });

      if (res.data.success) {
        setAccepted(true);
        Swal.fire({
          icon: "success",
          title: "Welcome!",
          text: "You have successfully joined the unit.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.error || "Failed to accept invite",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome Home!</h2>
          <p className="text-gray-600 mb-2">
            You have successfully joined
          </p>
          <p className="text-lg font-medium text-gray-800 mb-6">
            {invite?.property_name} - {invite?.unit_name}
          </p>
          <button
            onClick={() => router.push("/tenant/dashboard")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-emerald-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Property Image */}
        {invite?.property_photo ? (
          <div className="h-48 bg-gray-200 relative">
            <img
              src={invite.property_photo}
              alt={invite.property_name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-white/80" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{invite?.property_name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{invite?.unit_name}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Link expires in <span className="font-semibold">{formatTime(timeLeft)}</span>
              </span>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Move in to your unit</p>
                <p className="text-xs text-gray-500">Access your unit dashboard and manage your lease</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">View lease details</p>
                <p className="text-xs text-gray-500">Review your lease agreement and payment schedule</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting || timeLeft === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Joining...
              </>
            ) : (
              <>
                Accept & Join Unit
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            By accepting, you agree to join this unit as a tenant
          </p>
        </div>
      </div>
    </div>
  );
}
