"use client";

import React from "react";

export default function EulaPage() {
  const lastUpdated = "November 30, 2025";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <header className="px-6 py-8 sm:px-12 sm:py-10 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">End-User License Agreement (EULA)</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: <span className="font-medium text-gray-800">{lastUpdated}</span></p>
        </header>

        <article className="px-6 py-8 sm:px-12 sm:py-10 prose max-w-none text-gray-700">
          <section>
            <p>
              UPKYP grants you access to the platform and its services through this End-User License Agreement ("EULA").
              By accessing or using the Service, you agree to the terms in this Agreement.
            </p>
          </section>

          <section>
            <h2>Definitions and Key Terms</h2>
            <ul>
              <li><strong>Cookie:</strong> Small data stored by your browser for analytics or login preferences.</li>
              <li><strong>Company:</strong> Refers to Abstra Technologies, Taft Avenue Ermita Manila 1000.</li>
              <li><strong>Country:</strong> Philippines.</li>
              <li><strong>Service:</strong> The UPKYP platform and tools.</li>
              <li><strong>Third-party service:</strong> External services we use or integrate with.</li>
              <li><strong>Website:</strong> https://rent-alley-web.vercel.app/</li>
              <li><strong>You:</strong> Any registered user of UPKYP.</li>
            </ul>
          </section>

          <section>
            <h2>Introduction</h2>
            <p>
              This Agreement is between you (the End User) and UPKYP. If you are using UPKYP on behalf of an
              organization, you confirm that you have authority to accept this Agreement for that organization.
            </p>
            <p>
              By accessing, downloading, or using the platform, you confirm that you understand and agree to this EULA.
              If you do not agree, discontinue use immediately.
            </p>
          </section>

          <section>
            <h2>License Granted</h2>
            <p>UPKYP grants you a limited, non-exclusive, revocable license to:</p>
            <ul>
              <li>Access and use the platform on one device per user license.</li>
              <li>Use the app and content provided within UPKYP strictly under this Agreement.</li>
              <li>Install and use a trial version for 15 days (if applicable).</li>
              <li>Receive updates released within 1 year of the license purchase.</li>
            </ul>
          </section>

          <section>
            <h2>Restrictions</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Sell, rent, sublicense, or distribute the platform.</li>
              <li>Reverse-engineer, decrypt, modify, or create derivative works of the platform.</li>
              <li>Remove copyright or proprietary labels.</li>
            </ul>
          </section>

          <section>
            <h2>Intellectual Property</h2>
            <p>
              All rights, trademarks, source code, and platform content belong exclusively to UPKYP and its licensors.
              Your license is limited to use only; it does not grant ownership or intellectual property rights.
            </p>
          </section>

          <section>
            <h2>Your Suggestions</h2>
            <p>
              Any feedback or suggestions you submit may be used freely by UPKYP without compensation or obligation.
            </p>
          </section>

          <section>
            <h2>Modifications and Updates</h2>
            <p>
              UPKYP may modify, update, or discontinue features at any time. Updates may add or remove functionality.
            </p>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>
              UPKYP may integrate with third-party apps or content. We are not responsible for their accuracy, operation,
              or policies. Use them at your own risk.
            </p>
          </section>

          <section>
            <h2>Term and Termination</h2>
            <p>
              This Agreement remains active until terminated. UPKYP may terminate access at any time for violations or
              misuse. After termination, you must stop using the platform and delete all copies.
            </p>
          </section>

          <section>
            <h2>Indemnification</h2>
            <p>
              You agree to hold UPKYP harmless for any claims or damages arising from misuse of the platform or
              violations of this Agreement.
            </p>
          </section>

          <section>
            <h2>No Warranties</h2>
            <p>
              UPKYP is provided "AS IS" without warranties of any kind. We do not guarantee uninterrupted service,
              accuracy, or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              UPKYP is not liable for indirect, incidental, or consequential damages. Liability is limited to the amount
              paid for using the Service.
            </p>
          </section>

          <section>
            <h2>Severability</h2>
            <p>
              If any part of this Agreement is unenforceable, the remaining terms stay in effect.
            </p>
          </section>

          <section>
            <h2>Amendments</h2>
            <p>
              UPKYP may update this EULA anytime. You will be notified of major changes. Continued use means acceptance
              of the updated terms.
            </p>
          </section>

          <section>
            <h2>Governing Law</h2>
            <p>This Agreement is governed by the laws of the Republic of the Philippines.</p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>If you have questions about this EULA, you may contact us at:</p>
            <p className="font-medium">support@upkyp.com</p>
          </section>

          <footer className="mt-6 text-sm text-gray-500">
            <p>This EULA governs your licensed use of the UPKYP platform.</p>
          </footer>
        </article>
      </div>
    </main>
  );
}