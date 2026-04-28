"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

type VerificationStatus = "not_verified" | "pending" | "approved" | "rejected";

export default function VerificationPage() {
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();
  const [status, setStatus] = useState<VerificationStatus>("not_verified");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get("/api/landlord/verification/status");
      setStatus(res.data.status === "not verified" ? "not_verified" : res.data.status);
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      fetchSession().finally(() => fetchStatus());
    } else {
      fetchStatus();
    }
  }, [user, fetchSession, fetchStatus]);

  useEffect(() => {
    if (status !== "pending") return;

    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= 60) {
          clearInterval(interval);
          return prev;
        }
        fetchStatus();
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  const handleStartVerification = async () => {
    setStarting(true);
    setError(null);

    try {
      const res = await axios.post("/api/landlord/verification/start");
      const { redirect_url } = res.data;

      if (redirect_url) {
        window.location.href = redirect_url;
      } else {
        setError("Failed to start verification session. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification start failed:", err);
      setError(
        err.response?.data?.error || "Failed to start verification. Please try again."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading verification status..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-4 shadow-lg shadow-blue-500/25"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-500 text-sm">
            Verify your identity using Diddit to build trust with tenants
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {status === "approved" && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified</h3>
                    <p className="text-sm text-gray-500">
                      Your identity has been successfully verified
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/landlord/dashboard")}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {status === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Under Review
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your verification is being processed. This may take a few
                      minutes.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">
                      Checking status...
                    </span>
                  </div>
                </div>

                <button
                  onClick={fetchStatus}
                  className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
              </motion.div>
            )}

            {status === "rejected" && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Verification Failed
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your identity verification was not approved. Please try
                      again with a valid ID.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartVerification}
                  disabled={starting}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Try Again
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {status === "not_verified" && (
              <motion.div
                key="not_verified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <div className="space-y-4 mb-6">
                  {[
                    {
                      step: "1",
                      title: "Click Start Verification",
                      desc: "You'll be redirected to Diddit's secure verification page",
                    },
                    {
                      step: "2",
                      title: "Complete Identity Check",
                      desc: "Follow the steps to verify your identity with a valid ID",
                    },
                    {
                      step: "3",
                      title: "Wait for Approval",
                      desc: "Your verification will be reviewed and updated automatically",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          {item.step}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartVerification}
                  disabled={starting}
                  className="w-full px-4 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting Verification...
                    </>
                  ) : (
                    <>
                      Start Verification
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="w-full mt-4 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Go Back
        </button>
      </motion.div>
    </div>
  );
}
