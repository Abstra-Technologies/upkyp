"use client";

import React from "react";

export default function TermsPage() {
  const lastUpdated = "November 14, 2025";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <header className="px-6 py-8 sm:px-12 sm:py-10 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">UPKYP — Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: <span className="font-medium text-gray-800">{lastUpdated}</span></p>
        </header>

        <article className="px-6 py-8 sm:px-12 sm:py-10 prose max-w-none text-gray-700">
          <section>
            <h2>Welcome</h2>
            <p>
              These Terms and Conditions (also called "Terms of Service") govern your access to and use of the
              UPKYP platform, website, mobile applications, and related services (together, the "Service"). By
              creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the
              Service.
            </p>
          </section>

          <section>
            <h3>1. Definitions</h3>
            <ul>
              <li><strong>UPKYP, we, us</strong> — the platform and its operator.</li>
              <li><strong>User, you</strong> — any person using the Service (landlord, tenant, or admin).</li>
              <li><strong>Landlord</strong> — user listing or managing properties/units.</li>
              <li><strong>Tenant</strong> — user inquiring, leasing, or occupying a unit.</li>
            </ul>
          </section>

          <section>
            <h3>2. Eligibility</h3>
            <p>
              You must be at least 18 years old and legally competent to enter agreements. You agree to provide
              accurate information and to comply with all applicable laws. We may suspend or terminate accounts that
              violate eligibility requirements.
            </p>
          </section>

          <section>
            <h3>3. Account responsibilities</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity
              under your account. Notify support immediately if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h3>4. Platform services</h3>
            <p>
              UPKYP provides tools for property listing, communication, lease administration, billing, payments,
              maintenance requests, and analytics. UPKYP is a technology platform only — we are not a real estate broker,
              property manager, or guarantor of payments.
            </p>
          </section>

          <section>
            <h3>5. Subscriptions &amp; payments</h3>
            <p>
              Paid plans are available to landlords for premium features and higher listing limits. Subscription fees
              are billed according to your chosen plan and are generally non-refundable except where required by law.
              Plans may auto-renew unless cancelled prior to renewal.
            </p>
          </section>

          <section>
            <h3>6. Listings and content</h3>
            <p>
              Landlords are responsible for the accuracy and legality of their listings and for having the necessary
              rights to any photos or documents they upload. UPKYP may remove content that violates these Terms.
            </p>
          </section>

          <section>
            <h3>7. Lease agreements and transactions</h3>
            <p>
              Lease agreements, payments, and other transactions occur between landlords and tenants. UPKYP only
              facilitates tools and is not a party to any lease. Disputes between parties are their responsibility.
            </p>
          </section>

          <section>
            <h3>8. Prohibited activities</h3>
            <p>
              You must not misuse the Service. Prohibited activities include fraud, harassment, uploading malware,
              bypassing security, creating fake accounts, and infringing intellectual property rights. Violations may
              result in suspension, termination, or legal action.
            </p>
          </section>

          <section>
            <h3>9. Reviews and feedback</h3>
            <p>
              Users may leave reviews and feedback. Reviews must be honest and not defamatory. UPKYP may remove reviews
              that breach these rules.
            </p>
          </section>

          <section>
            <h3>10. Privacy</h3>
            <p>
              Our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> explains how we collect,
              use, and store personal information. By using the Service you consent to data processing as described in
              that policy.
            </p>
          </section>

          <section>
            <h3>11. Intellectual property</h3>
            <p>
              All UPKYP trademarks, service marks, and content are owned by UPKYP or its licensors. You may not copy,
              modify, or redistribute UPKYP's proprietary content without written permission.
            </p>
          </section>

          <section>
            <h3>12. Service availability</h3>
            <p>
              We strive to provide continuous service but do not guarantee uninterrupted access. We may suspend the
              Service for maintenance, security reasons, or upgrades.
            </p>
          </section>

          <section>
            <h3>13. Limitation of liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, UPKYP IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR
              CONSEQUENTIAL DAMAGES, OR LOST PROFITS, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h3>14. Termination</h3>
            <p>
              We may suspend or terminate accounts that violate these Terms or for legal reasons. You may delete your
              account at any time; however, records of past transactions may be retained for legal or operational
              reasons.
            </p>
          </section>

          <section>
            <h3>15. Changes to the Terms</h3>
            <p>
              We may update these Terms periodically. Material changes will be notified by email or in-app. Continued use
              after changes indicates acceptance.
            </p>
          </section>

          <section>
            <h3>16. Governing law</h3>
            <p>
              These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict of law
              principles. If any provision is invalid, the rest remain in effect.
            </p>
          </section>

          <section>
            <h3>17. Contact</h3>
            <p>
              Questions or notices about these Terms can be sent to:
            </p>
            <p className="font-medium">support@upkyp.com</p>
          </section>

          <footer className="mt-6 text-sm text-gray-500">
            <p>These Terms form the entire agreement between you and UPKYP regarding the Service.</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
