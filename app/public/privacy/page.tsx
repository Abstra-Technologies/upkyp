'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "information-collected", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "sharing", label: "Sharing of Information" },
  { id: "data-security", label: "Data Security" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Rights" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "international-transfers", label: "International Transfers" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "changes", label: "Changes to Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicyPage() {
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
            <h1 className="text-sm sm:text-lg font-bold text-gray-900">Privacy Policy</h1>
            {/* Mobile TOC toggle */}
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
                  UPKYP — Privacy Policy
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Last updated: <span className="font-medium text-gray-700">{lastUpdated}</span>
                </p>
              </div>

              {/* Scrollable content */}
              <div className="px-5 py-6 sm:px-10 sm:py-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
                  {/* Introduction */}
                  <section id="introduction">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Introduction</h2>
                    <p>
                      UPKYP ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how your personal
                      information is collected, used, and disclosed when you use our website, mobile application, and related services
                      (collectively, the "Service"). By accessing or using UPKYP, you agree to the practices described in this Privacy Policy
                      and our Terms of Service.
                    </p>
                  </section>

                  {/* Information We Collect */}
                  <section id="information-collected">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                    <p className="mb-3">We collect personal information that you voluntarily provide when registering, filling out forms, booking visits, sending inquiries, subscribing to newsletters, or using any part of the Service.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                      <li>Name & Username</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>Age</li>
                      <li>Job title</li>
                      <li>Account password</li>
                      <li>Uploaded documents (e.g., IDs, permits, lease agreements)</li>
                    </ul>
                    <p>
                      We also collect non-personal data such as device information, IP addresses, browser type, session data, and cookies to improve the platform experience.
                    </p>
                  </section>

                  {/* How We Use */}
                  <section id="how-we-use">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                    <p className="mb-3">Your information may be used for the following purposes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>To create and manage your account</li>
                      <li>To provide features such as property listings, billing, maintenance requests, and communication tools</li>
                      <li>To process payments and subscriptions</li>
                      <li>To send notifications, reminders, and service updates</li>
                      <li>To improve the Service through analytics and user feedback</li>
                      <li>To comply with legal obligations</li>
                    </ul>
                  </section>

                  {/* Cookies */}
                  <section id="cookies">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">3. Cookies & Tracking Technologies</h2>
                    <p>
                      UPKYP uses cookies, local storage, and similar technologies to enhance user experience, remember login sessions, enable analytics, and personalize content. You may disable cookies through your browser, but some features may not function properly.
                    </p>
                  </section>

                  {/* Sharing */}
                  <section id="sharing">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">4. Sharing of Information</h2>
                    <p className="mb-3">We may share your information with:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                      <li>Trusted service providers (payment processors, hosting providers, analytics tools)</li>
                      <li>Third-party partners when you opt-in or request integrations</li>
                      <li>Law enforcement when required by law</li>
                      <li>Successor entities in case of a merger or acquisition</li>
                    </ul>
                    <p>
                      We do <strong>not</strong> sell user data.
                    </p>
                  </section>

                  {/* Data Security */}
                  <section id="data-security">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">5. Data Security</h2>
                    <p>
                      We implement technical and administrative measures to safeguard your information. However, no digital platform can guarantee absolute security. You are responsible for keeping your login credentials secure.
                    </p>
                  </section>

                  {/* Data Retention */}
                  <section id="data-retention">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">6. Data Retention</h2>
                    <p>
                      We retain data as long as your account is active or as needed to provide services, comply with laws, resolve disputes, or maintain system integrity.
                    </p>
                  </section>

                  {/* Your Rights */}
                  <section id="your-rights">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
                    <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                      <li>Access and request a copy of your personal data</li>
                      <li>Request correction of inaccurate information</li>
                      <li>Request deletion of your data</li>
                      <li>Restrict or object to processing</li>
                      <li>Export or transfer your data</li>
                    </ul>
                    <p>You may exercise these rights by contacting us.</p>
                  </section>

                  {/* Children's Privacy */}
                  <section id="childrens-privacy">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">8. Children's Privacy</h2>
                    <p>
                      UPKYP does not knowingly collect data from anyone under 13 years old. If we become aware of such a case, we will remove the information promptly.
                    </p>
                  </section>

                  {/* International Transfers */}
                  <section id="international-transfers">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">9. International Data Transfers</h2>
                    <p>
                      Your information may be processed or transferred to servers located outside your country. By using the Service, you consent to such transfers.
                    </p>
                  </section>

                  {/* Third-Party */}
                  <section id="third-party">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">10. Third-Party Services</h2>
                    <p>
                      The platform may contain links or integrations with third-party websites or services. UPKYP is not responsible for their content, policies, or security.
                    </p>
                  </section>

                  {/* Changes */}
                  <section id="changes">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">11. Changes to This Privacy Policy</h2>
                    <p>
                      We may update this Privacy Policy from time to time. You will be notified through the app or via email when significant changes occur. Continued use of the Service means you accept the updated policy.
                    </p>
                  </section>

                  {/* Contact */}
                  <section id="contact">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">12. Contact Us</h2>
                    <p className="mb-2">If you have questions or concerns about this Privacy Policy, you may contact us at:</p>
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
