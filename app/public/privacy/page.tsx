"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 30, 2025";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <header className="px-6 py-8 sm:px-12 sm:py-10 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">UPKYP — Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: <span className="font-medium text-gray-800">{lastUpdated}</span></p>
        </header>

        <article className="px-6 py-8 sm:px-12 sm:py-10 prose max-w-none text-gray-700">
          <section>
            <h2>Introduction</h2>
            <p>
              UPKYP ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how your personal
              information is collected, used, and disclosed when you use our website, mobile application, and related services
              (collectively, the "Service"). By accessing or using UPKYP, you agree to the practices described in this Privacy Policy
              and our Terms of Service.
            </p>
          </section>

          <section>
            <h3>1. Information We Collect</h3>
            <p>We collect personal information that you voluntarily provide when registering, filling out forms, booking visits, sending
              inquiries, subscribing to newsletters, or using any part of the Service.</p>
            <ul>
              <li>Name & Username</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Age</li>
              <li>Job title</li>
              <li>Account password</li>
              <li>Uploaded documents (e.g., IDs, permits, lease agreements)</li>
            </ul>
            <p>
              We also collect non-personal data such as device information, IP addresses, browser type, session data, and cookies to
              improve the platform experience.
            </p>
          </section>

          <section>
            <h3>2. How We Use Your Information</h3>
            <p>Your information may be used for the following purposes:</p>
            <ul>
              <li>To create and manage your account</li>
              <li>To provide features such as property listings, billing, maintenance requests, and communication tools</li>
              <li>To process payments and subscriptions</li>
              <li>To send notifications, reminders, and service updates</li>
              <li>To improve the Service through analytics and user feedback</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h3>3. Cookies & Tracking Technologies</h3>
            <p>
              UPKYP uses cookies, local storage, and similar technologies to enhance user experience, remember login sessions, enable
              analytics, and personalize content. You may disable cookies through your browser, but some features may not function
              properly.
            </p>
          </section>

          <section>
            <h3>4. Sharing of Information</h3>
            <p>We may share your information with:</p>
            <ul>
              <li>Trusted service providers (payment processors, hosting providers, analytics tools)</li>
              <li>Third-party partners when you opt-in or request integrations</li>
              <li>Law enforcement when required by law</li>
              <li>Successor entities in case of a merger or acquisition</li>
            </ul>
            <p>
              We do <strong>not</strong> sell user data.
            </p>
          </section>

          <section>
            <h3>5. Data Security</h3>
            <p>
              We implement technical and administrative measures to safeguard your information. However, no digital platform can
              guarantee absolute security. You are responsible for keeping your login credentials secure.
            </p>
          </section>

          <section>
            <h3>6. Data Retention</h3>
            <p>
              We retain data as long as your account is active or as needed to provide services, comply with laws, resolve disputes,
              or maintain system integrity.
            </p>
          </section>

          <section>
            <h3>7. Your Rights</h3>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access and request a copy of your personal data</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Restrict or object to processing</li>
              <li>Export or transfer your data</li>
            </ul>
            <p>You may exercise these rights by contacting us.</p>
          </section>

          <section>
            <h3>8. Children's Privacy</h3>
            <p>
              UPKYP does not knowingly collect data from anyone under 13 years old. If we become aware of such a case, we will remove the
              information promptly.
            </p>
          </section>

          <section>
            <h3>9. International Data Transfers</h3>
            <p>
              Your information may be processed or transferred to servers located outside your country. By using the Service, you consent
              to such transfers.
            </p>
          </section>

          <section>
            <h3>10. Third-Party Services</h3>
            <p>
              The platform may contain links or integrations with third-party websites or services. UPKYP is not responsible for their
              content, policies, or security.
            </p>
          </section>

          <section>
            <h3>11. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. You will be notified through the app or via email when significant
              changes occur. Continued use of the Service means you accept the updated policy.
            </p>
          </section>

          <section>
            <h3>12. Contact Us</h3>
            <p>If you have questions or concerns about this Privacy Policy, you may contact us at:</p>
            <p className="font-medium">support@upkyp.com</p>
          </section>

          <footer className="mt-6 text-sm text-gray-500">
            <p>This Privacy Policy explains how UPKYP collects, uses, and protects your information.</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
