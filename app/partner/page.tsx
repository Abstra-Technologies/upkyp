"use client";

import {
  Building,
  BarChart,
  Globe,
  Mail,
  Phone,
  User,
  Building2,
  MapPin,
} from "lucide-react";
import Page_footer from "../../../components/navigation/page_footer";
import { useState } from "react";

export default function Partner() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/partner-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          company: "",
          location: "",
          message: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <span className="inline-block bg-gradient-to-r from-blue-100 to-emerald-100 text-transparent bg-clip-text font-semibold px-4 py-1 rounded-full text-sm mb-4 border border-blue-200">
            Partnership Program
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Grow Your Business</span>
            <span className="block bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text">
              With UpKyp
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Join our network of property management professionals and expand
            your reach while providing clients with innovative rental solutions.
          </p>
        </div>
      </div>

      {/* Partner Benefits */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Partner Benefits
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Increased Revenue
            </h3>
            <p className="text-gray-600">
              Earn competitive commissions on referred clients and access new
              revenue streams through our platform.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Expanded Portfolio
            </h3>
            <p className="text-gray-600">
              Offer advanced property management tools to your clients without
              developing them yourself.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Market Expansion
            </h3>
            <p className="text-gray-600">
              Reach new geographic markets and customer segments through our
              growing platform.
            </p>
          </div>
        </div>
      </div>

      {/* How Partnership Works */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How Our Partnership Works
          </h2>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text">
                  1
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Apply
                </h3>
                <p className="text-gray-600">
                  Complete our application form below. We'll review your
                  business and get back to you within 48 hours.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text">
                  2
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Onboard
                </h3>
                <p className="text-gray-600">
                  Get trained on our platform and receive exclusive partner
                  resources, marketing materials, and support.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text">
                  3
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Grow Together
                </h3>
                <p className="text-gray-600">
                  Start referring clients, earning commissions, and growing your
                  business with UpKyp's powerful tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Section */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-500 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Apply for Partnership
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Fill out the form below and we'll get back to you within 48 hours.
            </p>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-emerald-100 border border-emerald-400 text-emerald-700 rounded-lg">
                Thank you for your application! We'll review your information
                and get back to you soon.
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                There was an error submitting your application. Please try again
                or contact us directly at abstra.technologies@gmail.com
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Company"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Province"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tell us about your business *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your business, your experience in property management, and why you'd like to partner with UpKyp..."
                />
              </div>

              <button
                type="submit"
                disabled={true}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-3 px-8 rounded-lg text-lg font-medium transition-all duration-200 shadow-md opacity-50 cursor-not-allowed"
              >
                Applications Opening Soon
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                For partnership inquiries, please contact us at{" "}
                <a
                  href="mailto:abstra.technologies@gmail.com"
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 text-transparent bg-clip-text font-medium hover:underline"
                >
                  abstra.technologies@gmail.com
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Page_footer />
    </div>
  );
}
