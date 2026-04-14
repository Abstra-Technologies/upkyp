"use client";

import React from "react";

export default function RefundPolicyPage() {
  const lastUpdated = "November 30, 2025";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <header className="px-6 py-8 sm:px-12 sm:py-10 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Return & Refund Policy</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: <span className="font-medium text-gray-800">{lastUpdated}</span></p>
        </header>

        <article className="px-6 py-8 sm:px-12 sm:py-10 prose max-w-none text-gray-700">

          <section>
            <p>
              Thank you for choosing UPKYP. We aim to give you a smooth and rewarding experience while using and purchasing our services.
              By purchasing or using any UPKYP service, you agree to this Return & Refund Policy and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2>Definitions and Key Terms</h2>
            <ul>
              <li><strong>Company:</strong> Refers to UPKYP, which is responsible for this policy.</li>
              <li><strong>Customer:</strong> Any person or organization using UPKYP services.</li>
              <li><strong>Device:</strong> Any internet-connected device used to access UPKYP.</li>
              <li><strong>Service:</strong> The software and tools provided by UPKYP.</li>
              <li><strong>Website:</strong> https://rent-alley-web.vercel.app/</li>
              <li><strong>You:</strong> A registered user of UPKYP.</li>
            </ul>
          </section>

          <section>
            <h2>Return & Refund Policy</h2>
            <p>
              If something is wrong with the service you purchased or you are unhappy with it, you may request a refund
              within <strong>1 week</strong> of your purchase. Refunds will only be processed if the request follows the guidelines described in this policy.
            </p>
          </section>

          <section>
            <h2>Refunds</h2>
            <p>
              UPKYP strives to provide high-quality digital services. All services are inspected and verified before being delivered.
              However, if a service becomes unavailable or cannot be fulfilled (e.g., technical issues or system limitations), we may cancel your order.
            </p>
            <p>
              If you paid online, your refund will be processed after confirmation from our support team. Refund processing time
              may vary, but you will be notified once the refund has been issued.
            </p>
            <p>
              Note: UPKYP is not responsible for any damages or losses caused by third-party systems, integrations, or transportation of physical goods (if applicable).
            </p>
          </section>

          <section>
            <h2>Shipping</h2>
            <p>
              If a return of any physical materials is required, UPKYP will cover all return shipping costs, even if the
              original item did not have free shipping.
            </p>
          </section>

          <section>
            <h2>Your Consent</h2>
            <p>
              By using our website, registering an account, or making a purchase, you consent to the terms outlined in this Return & Refund Policy.
            </p>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>
              UPKYP may update or modify this Return & Refund Policy at any time to accurately reflect service changes. Updates will
              be posted on this page. Continued use of the Service after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>If you are not fully satisfied with your UPKYP service, contact us:</p>
            <p className="font-medium">abstra.technologies@gmail.com</p>
          </section>

          <footer className="mt-6 text-sm text-gray-500">
            <p>This Return & Refund Policy explains how UPKYP handles cancellations and refunds.</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
