"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiMail, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

export default function VerificationSuccess() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/40 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-emerald-400/20 rounded-full blur-3xl" />

        <div
          className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "2s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-emerald-300/30 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-2 h-2 bg-blue-300/40 rounded-full animate-bounce"
          style={{ animationDelay: "1.5s", animationDuration: "2.2s" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div
          className={`
                        max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 
                        border border-white/50 p-6 sm:p-8 lg:p-10 text-center
                        transition-all duration-700 ease-out
                        ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                    `}
        >
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FiCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Verification Submitted!
          </h1>
          <p className="text-gray-500 mb-8">
            Thank you for completing your verification
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <FiClock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  Under Review
                </p>
                <p className="text-xs text-gray-500">
                  Usually takes 1-2 business days
                </p>
              </div>
            </div>
          </div>

          <div className="text-left mb-8">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              What happens next?
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-600">
                  Our team will review your submitted documents
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-600">
                  We'll verify your identity matches your ID photo
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <FiMail className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600">
                  You'll receive an email once your verification is complete
                </p>
              </li>
            </ul>
          </div>

          <Link
            href="/landlord/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span>Go to Dashboard</span>
            <FiArrowRight className="w-5 h-5" />
          </Link>

          {/* Help link */}
          <p className="mt-4 text-sm text-gray-400">
            Questions?{" "}
            <a
              href="/support"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
