'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const sections = [
  { id: "intro", label: "Introduction" },
  { id: "definitions", label: "Definitions" },
  { id: "license", label: "License Granted" },
  { id: "restrictions", label: "Restrictions" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "suggestions", label: "Your Suggestions" },
  { id: "modifications", label: "Modifications & Updates" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "termination", label: "Term & Termination" },
  { id: "indemnification", label: "Indemnification" },
  { id: "no-warranties", label: "No Warranties" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "severability", label: "Severability" },
  { id: "amendments", label: "Amendments" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact Us" },
];

export default function EulaPage() {
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
            <h1 className="text-sm sm:text-lg font-bold text-gray-900">EULA</h1>
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
                  End-User License Agreement (EULA)
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Last updated: <span className="font-medium text-gray-700">{lastUpdated}</span>
                </p>
              </div>

              {/* Scrollable content */}
              <div className="px-5 py-6 sm:px-10 sm:py-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
                  {/* Intro */}
                  <section id="intro">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Introduction</h2>
                    <p>
                      UPKYP grants you access to the platform and its services through this End-User License Agreement ("EULA").
                      By accessing or using the Service, you agree to the terms in this Agreement.
                    </p>
                    <p className="mt-3">
                      This Agreement is between you (the End User) and UPKYP. If you are using UPKYP on behalf of an
                      organization, you confirm that you have authority to accept this Agreement for that organization.
                    </p>
                    <p className="mt-3">
                      By accessing, downloading, or using the platform, you confirm that you understand and agree to this EULA.
                      If you do not agree, discontinue use immediately.
                    </p>
                  </section>

                  {/* Definitions */}
                  <section id="definitions">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">1. Definitions</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Cookie:</strong> Small data stored by your browser for analytics or login preferences.</li>
                      <li><strong>Company:</strong> Refers to Abstra Technologies, Taft Avenue Ermita Manila 1000.</li>
                      <li><strong>Country:</strong> Philippines.</li>
                      <li><strong>Service:</strong> The UPKYP platform and tools.</li>
                      <li><strong>Third-party service:</strong> External services we use or integrate with.</li>
                      <li><strong>Website:</strong> https://rent-alley-web.vercel.app/</li>
                      <li><strong>You:</strong> Any registered user of UPKYP.</li>
                    </ul>
                  </section>

                  {/* License */}
                  <section id="license">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">2. License Granted</h2>
                    <p className="mb-3">UPKYP grants you a limited, non-exclusive, revocable license to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Access and use the platform on one device per user license.</li>
                      <li>Use the app and content provided within UPKYP strictly under this Agreement.</li>
                      <li>Install and use a trial version for 15 days (if applicable).</li>
                      <li>Receive updates released within 1 year of the license purchase.</li>
                    </ul>
                  </section>

                  {/* Restrictions */}
                  <section id="restrictions">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">3. Restrictions</h2>
                    <p className="mb-3">You agree NOT to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Sell, rent, sublicense, or distribute the platform.</li>
                      <li>Reverse-engineer, decrypt, modify, or create derivative works of the platform.</li>
                      <li>Remove copyright or proprietary labels.</li>
                    </ul>
                  </section>

                  {/* Intellectual Property */}
                  <section id="intellectual-property">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">4. Intellectual Property</h2>
                    <p>
                      All rights, trademarks, source code, and platform content belong exclusively to UPKYP and its licensors.
                      Your license is limited to use only; it does not grant ownership or intellectual property rights.
                    </p>
                  </section>

                  {/* Suggestions */}
                  <section id="suggestions">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">5. Your Suggestions</h2>
                    <p>
                      Any feedback or suggestions you submit may be used freely by UPKYP without compensation or obligation.
                    </p>
                  </section>

                  {/* Modifications */}
                  <section id="modifications">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">6. Modifications & Updates</h2>
                    <p>
                      UPKYP may modify, update, or discontinue features at any time. Updates may add or remove functionality.
                    </p>
                  </section>

                  {/* Third-Party */}
                  <section id="third-party">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">7. Third-Party Services</h2>
                    <p>
                      UPKYP may integrate with third-party apps or content. We are not responsible for their accuracy, operation,
                      or policies. Use them at your own risk.
                    </p>
                  </section>

                  {/* Termination */}
                  <section id="termination">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">8. Term & Termination</h2>
                    <p>
                      This Agreement remains active until terminated. UPKYP may terminate access at any time for violations or
                      misuse. After termination, you must stop using the platform and delete all copies.
                    </p>
                  </section>

                  {/* Indemnification */}
                  <section id="indemnification">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">9. Indemnification</h2>
                    <p>
                      You agree to hold UPKYP harmless for any claims or damages arising from misuse of the platform or
                      violations of this Agreement.
                    </p>
                  </section>

                  {/* No Warranties */}
                  <section id="no-warranties">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">10. No Warranties</h2>
                    <p>
                      UPKYP is provided "AS IS" without warranties of any kind. We do not guarantee uninterrupted service,
                      accuracy, or fitness for a particular purpose.
                    </p>
                  </section>

                  {/* Liability */}
                  <section id="liability">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">11. Limitation of Liability</h2>
                    <p>
                      UPKYP is not liable for indirect, incidental, or consequential damages. Liability is limited to the amount
                      paid for using the Service.
                    </p>
                  </section>

                  {/* Severability */}
                  <section id="severability">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">12. Severability</h2>
                    <p>
                      If any part of this Agreement is unenforceable, the remaining terms stay in effect.
                    </p>
                  </section>

                  {/* Amendments */}
                  <section id="amendments">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">13. Amendments</h2>
                    <p>
                      UPKYP may update this EULA anytime. You will be notified of major changes. Continued use means acceptance
                      of the updated terms.
                    </p>
                  </section>

                  {/* Governing Law */}
                  <section id="governing-law">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">14. Governing Law</h2>
                    <p>
                      This Agreement is governed by the laws of the Republic of the Philippines.
                    </p>
                  </section>

                  {/* Contact */}
                  <section id="contact">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">15. Contact Us</h2>
                    <p className="mb-2">If you have questions about this EULA, you may contact us at:</p>
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
