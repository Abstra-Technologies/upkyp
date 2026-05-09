'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "Refund Eligibility" },
  { id: "non-refundable", label: "Non-Refundable Cases" },
  { id: "process", label: "Refund Process" },
  { id: "processing-time", label: "Processing Time" },
  { id: "changes", label: "Changes to Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function RefundPolicyPage() {
  const lastUpdated = "November 30, 2025";
  const [activeSection, setActiveSection] = useState("");
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setTocOpen(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Back</span>
            </Link>
            <h1 className="text-sm sm:text-lg font-bold text-gray-900">Refund Policy</h1>
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Toggle table of contents"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block w-16" />
          </div>
        </div>
      </header>

      {/* Mobile TOC Dropdown */}
      {tocOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setTocOpen(false)}>
          <div
            className="bg-white w-72 h-full overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Contents</h2>
            </div>
            <nav className="p-3">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex gap-6 lg:gap-10">
          {/* Desktop Sidebar TOC */}
          <aside className="hidden sm:block w-56 lg:w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-3">
                Contents
              </h2>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      activeSection === s.id
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Title area */}
              <div className="px-5 py-6 sm:px-10 sm:py-8 border-b border-gray-100">
                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
                  UPKYP — Refund Policy
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Last updated: <span className="font-medium text-gray-700">{lastUpdated}</span>
                </p>
              </div>

              {/* Scrollable content */}
              <div className="px-5 py-6 sm:px-10 sm:py-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
                  {/* Overview */}
                  <section id="overview">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Overview</h2>
                    <p>
                      Thank you for choosing UPKYP. We aim to provide a smooth and rewarding experience. This Refund Policy outlines the conditions under which refunds may be requested and processed for our subscription services.
                    </p>
                  </section>

                  {/* Eligibility */}
                  <section id="eligibility">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">1. Refund Eligibility</h2>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 mb-4">
                      <p className="font-semibold text-blue-900 text-sm sm:text-base">
                        Refunds are only available within <span className="underline">10 days</span> of your subscription purchase.
                      </p>
                      <p className="text-blue-800 text-xs sm:text-sm mt-2">
                        After the 10-day window, no refunds will be issued under any circumstances.
                      </p>
                    </div>
                    <p>
                      To qualify for a refund, you must:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                      <li>Submit your refund request within 10 days of the subscription date</li>
                      <li>Provide your account details and proof of purchase</li>
                      <li>Not have violated our Terms of Service</li>
                    </ul>
                  </section>

                  {/* Non-Refundable */}
                  <section id="non-refundable">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">2. Non-Refundable Cases</h2>
                    <p className="mb-3">Refunds will <strong>not</strong> be issued in the following cases:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Requests made after the 10-day refund window</li>
                      <li>Accounts suspended or terminated for policy violations</li>
                      <li>Partial usage of subscription features beyond evaluation</li>
                      <li>Change of mind after the refund period has expired</li>
                    </ul>
                  </section>

                  {/* Process */}
                  <section id="process">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">3. Refund Process</h2>
                    <p>
                      To request a refund, contact our support team at <span className="font-semibold text-blue-600">support@upkyp.com</span> with your account details and reason for the request. Our team will review your case and respond within 3-5 business days.
                    </p>
                    <p className="mt-3">
                      If approved, the refund will be processed back to the original payment method used during purchase.
                    </p>
                  </section>

                  {/* Processing Time */}
                  <section id="processing-time">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">4. Processing Time</h2>
                    <p>
                      Refund processing times may vary depending on your payment provider. Typically, refunds are completed within 5-10 business days after approval. You will receive a confirmation email once the refund has been issued.
                    </p>
                  </section>

                  {/* Changes */}
                  <section id="changes">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">5. Changes to This Policy</h2>
                    <p>
                      UPKYP may update this Refund Policy at any time to reflect service changes. Updates will be posted on this page. Continued use of the Service after changes means you accept the updated terms.
                    </p>
                  </section>

                  {/* Contact */}
                  <section id="contact">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">6. Contact Us</h2>
                    <p className="mb-2">If you have questions or need to request a refund, contact us at:</p>
                    <p className="font-semibold text-blue-600">support@upkyp.com</p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
