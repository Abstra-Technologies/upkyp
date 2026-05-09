'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const sections = [
  { id: "welcome", label: "Welcome" },
  { id: "definitions", label: "Definitions" },
  { id: "eligibility", label: "Eligibility" },
  { id: "account-responsibilities", label: "Account Responsibilities" },
  { id: "platform-services", label: "Platform Services" },
  { id: "subscriptions", label: "Subscriptions & Payments" },
  { id: "listings", label: "Listings & Content" },
  { id: "lease-agreements", label: "Lease Agreements" },
  { id: "prohibited", label: "Prohibited Activities" },
  { id: "reviews", label: "Reviews & Feedback" },
  { id: "privacy", label: "Privacy" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "availability", label: "Service Availability" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "termination", label: "Termination" },
  { id: "changes", label: "Changes to Terms" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  const lastUpdated = "November 14, 2025";
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
            <h1 className="text-sm sm:text-lg font-bold text-gray-900">Terms & Conditions</h1>
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
                  UPKYP — Terms & Conditions
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Last updated: <span className="font-medium text-gray-700">{lastUpdated}</span>
                </p>
              </div>

              {/* Scrollable content */}
              <div className="px-5 py-6 sm:px-10 sm:py-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
                  {/* Welcome */}
                  <section id="welcome">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Welcome</h2>
                    <p>
                      These Terms and Conditions (also called "Terms of Service") govern your access to and use of the
                      UPKYP platform, website, mobile applications, and related services (together, the "Service"). By
                      creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the
                      Service.
                    </p>
                  </section>

                  {/* Definitions */}
                  <section id="definitions">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">1. Definitions</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>UPKYP, we, us</strong> — the platform and its operator.</li>
                      <li><strong>User, you</strong> — any person using the Service (landlord, tenant, or admin).</li>
                      <li><strong>Landlord</strong> — user listing or managing properties/units.</li>
                      <li><strong>Tenant</strong> — user inquiring, leasing, or occupying a unit.</li>
                    </ul>
                  </section>

                  {/* Eligibility */}
                  <section id="eligibility">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">2. Eligibility</h2>
                    <p>
                      You must be at least 18 years old and legally competent to enter agreements. You agree to provide
                      accurate information and to comply with all applicable laws. We may suspend or terminate accounts that
                      violate eligibility requirements.
                    </p>
                  </section>

                  {/* Account Responsibilities */}
                  <section id="account-responsibilities">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">3. Account Responsibilities</h2>
                    <p>
                      You are responsible for maintaining the confidentiality of your account credentials and for all activity
                      under your account. Notify support immediately if you suspect unauthorized access.
                    </p>
                  </section>

                  {/* Platform Services */}
                  <section id="platform-services">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">4. Platform Services</h2>
                    <p>
                      UPKYP provides tools for property listing, communication, lease administration, billing, payments,
                      maintenance requests, and analytics. UPKYP is a technology platform only — we are not a real estate broker,
                      property manager, or guarantor of payments.
                    </p>
                  </section>

                  {/* Subscriptions */}
                  <section id="subscriptions">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">5. Subscriptions & Payments</h2>
                    <p>
                      Paid plans are available to landlords for premium features and higher listing limits. Subscription fees
                      are billed according to your chosen plan and are generally non-refundable except where required by law.
                      Plans may auto-renew unless cancelled prior to renewal.
                    </p>
                  </section>

                  {/* Listings */}
                  <section id="listings">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">6. Listings & Content</h2>
                    <p>
                      Landlords are responsible for the accuracy and legality of their listings and for having the necessary
                      rights to any photos or documents they upload. UPKYP may remove content that violates these Terms.
                    </p>
                  </section>

                  {/* Lease Agreements */}
                  <section id="lease-agreements">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">7. Lease Agreements & Transactions</h2>
                    <p>
                      Lease agreements, payments, and other transactions occur between landlords and tenants. UPKYP only
                      facilitates tools and is not a party to any lease. Disputes between parties are their responsibility.
                    </p>
                  </section>

                  {/* Prohibited */}
                  <section id="prohibited">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">8. Prohibited Activities</h2>
                    <p>
                      You must not misuse the Service. Prohibited activities include fraud, harassment, uploading malware,
                      bypassing security, creating fake accounts, and infringing intellectual property rights. Violations may
                      result in suspension, termination, or legal action.
                    </p>
                  </section>

                  {/* Reviews */}
                  <section id="reviews">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">9. Reviews & Feedback</h2>
                    <p>
                      Users may leave reviews and feedback. Reviews must be honest and not defamatory. UPKYP may remove reviews
                      that breach these rules.
                    </p>
                  </section>

                  {/* Privacy */}
                  <section id="privacy">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">10. Privacy</h2>
                    <p>
                      Our <Link href="/public/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> explains how we collect,
                      use, and store personal information. By using the Service you consent to data processing as described in
                      that policy.
                    </p>
                  </section>

                  {/* Intellectual Property */}
                  <section id="intellectual-property">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">11. Intellectual Property</h2>
                    <p>
                      All UPKYP trademarks, service marks, and content are owned by UPKYP or its licensors. You may not copy,
                      modify, or redistribute UPKYP's proprietary content without written permission.
                    </p>
                  </section>

                  {/* Availability */}
                  <section id="availability">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">12. Service Availability</h2>
                    <p>
                      We strive to provide continuous service but do not guarantee uninterrupted access. We may suspend the
                      Service for maintenance, security reasons, or upgrades.
                    </p>
                  </section>

                  {/* Liability */}
                  <section id="liability">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">13. Limitation of Liability</h2>
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, UPKYP IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR
                      CONSEQUENTIAL DAMAGES, OR LOST PROFITS, ARISING FROM YOUR USE OF THE SERVICE.
                    </p>
                  </section>

                  {/* Termination */}
                  <section id="termination">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">14. Termination</h2>
                    <p>
                      We may suspend or terminate accounts that violate these Terms or for legal reasons. You may delete your
                      account at any time; however, records of past transactions may be retained for legal or operational
                      reasons.
                    </p>
                  </section>

                  {/* Changes */}
                  <section id="changes">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">15. Changes to the Terms</h2>
                    <p>
                      We may update these Terms periodically. Material changes will be notified by email or in-app. Continued use
                      after changes indicates acceptance.
                    </p>
                  </section>

                  {/* Governing Law */}
                  <section id="governing-law">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">16. Governing Law</h2>
                    <p>
                      These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict of law
                      principles. If any provision is invalid, the rest remain in effect.
                    </p>
                  </section>

                  {/* Contact */}
                  <section id="contact">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">17. Contact</h2>
                    <p className="mb-2">Questions or notices about these Terms can be sent to:</p>
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
