"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Mail, MessageSquare, HelpCircle, Send } from "lucide-react";
import Page_footer from "@/components/navigation/page_footer";

const ISSUES = [
  "Billing & Payments",
  "Account Access Issues",
  "Property Listing Problems",
  "Tenant/Landlord Disputes",
  "Technical Issues",
  "Other",
];

export default function ContactSupport() {
  const [email, setEmail] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !isValidEmail(email)) {
      Swal.fire({
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!selectedIssue || !message.trim()) {
      Swal.fire({
        title: "Error",
        text: "Please select an issue and describe your problem.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/support/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, selectedIssue, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      Swal.fire({
        title: "Support Request Sent",
        text: "Our support team will contact you soon via email.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      // Reset form
      setEmail("");
      setSelectedIssue("");
      setMessage("");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error instanceof Error ? error.message : "An error occurred",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <span className="inline-block bg-gradient-to-r from-blue-100 to-emerald-100 text-transparent bg-clip-text font-semibold px-4 py-1 rounded-full text-sm mb-4 border border-blue-200">
            Support Center
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
            <span className="block">We're Here to</span>
            <span className="block bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text">
              Help You
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500">
            Have a question or need assistance? Our support team is ready to
            help you with any issues you're experiencing.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Quick Info Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Email Support
            </h3>
            <p className="text-sm text-gray-600">Response within 24-48 hours</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Quick Response
            </h3>
            <p className="text-sm text-gray-600">We prioritize urgent issues</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Expert Help
            </h3>
            <p className="text-sm text-gray-600">Professional support team</p>
          </div>
        </div>

        {/* Support Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Submit a Support Request
            </h2>
            <p className="text-gray-600">
              Fill out the form below and our team will get back to you as soon
              as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Issue Selection */}
            <div>
              <label
                htmlFor="issue"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What can we help you with? *
              </label>
              <div className="relative">
                <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  id="issue"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  required
                >
                  <option value="">-- Select an issue type --</option>
                  {ISSUES.map((issue, index) => (
                    <option key={index} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Describe Your Issue *
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="message"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide as much detail as possible about your issue. Include any error messages, screenshots, or relevant information that might help us assist you better."
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Minimum 20 characters. Be as detailed as possible for faster
                resolution.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-3 px-6 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-emerald-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit Support Request</span>
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              You can also reach us directly at{" "}
              <a
                href="mailto:abstra.technologies@gmail.com"
                className="bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text font-medium hover:underline"
              >
                abstra.technologies@gmail.com
              </a>
            </p>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 sm:p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Common Questions
          </h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-700">
                How long will it take to get a response?
              </p>
              <p className="text-gray-600 text-sm mt-1">
                We typically respond within 24-48 hours. Urgent issues are
                prioritized.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                What information should I include?
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Include relevant details like error messages, screenshots, and
                steps to reproduce the issue.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                Can I track my support request?
              </p>
              <p className="text-gray-600 text-sm mt-1">
                You'll receive email updates on your support request status.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Page_footer />
    </div>
  );
}
