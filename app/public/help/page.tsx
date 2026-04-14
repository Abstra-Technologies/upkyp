"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { BackButton } from "@/components/navigation/backButton";
import {
  Search,
  HelpCircle,
  BookOpen,
  ChevronDown,
  MessageCircle,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"faqs" | "guides">("faqs");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  // Fetch FAQs
  const {
    data: faqs,
    error: faqError,
    isLoading: faqLoading,
  } = useSWR("/api/support/faqs", fetcher);
  // Fetch How-To Guides
  const {
    data: guides,
    error: guideError,
    isLoading: guideLoading,
  } = useSWR("/api/support/guides", fetcher);

  const filteredFAQs = faqs?.filter(
    (faq: any) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guides?.filter(
    (guide: any) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const toggleGuide = (id: number) => {
    setExpandedGuide(expandedGuide === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        <div className="max-w-4xl mx-auto">
          <BackButton label="Back to Dashboard" />

          {/* Header */}
          <div className="mt-6 mb-6">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  Support Center
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Find answers to common questions and helpful guides
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    FAQs
                  </p>
                </div>
                <p className="text-xl md:text-2xl font-bold text-blue-700">
                  {faqs?.length || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                    Guides
                  </p>
                </div>
                <p className="text-xl md:text-2xl font-bold text-emerald-700">
                  {guides?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guides or FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-sm md:text-base font-semibold transition-all relative ${
                  activeTab === "faqs"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("faqs")}
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">FAQs</span>
                <span className="sm:hidden">FAQs</span>
                {activeTab === "faqs" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-600" />
                )}
              </button>

              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-sm md:text-base font-semibold transition-all relative ${
                  activeTab === "guides"
                    ? "text-emerald-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("guides")}
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">How-To Guides</span>
                <span className="sm:hidden">Guides</span>
                {activeTab === "guides" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-600" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {/* FAQs Tab */}
              {activeTab === "faqs" && (
                <>
                  {faqError ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-600 font-semibold text-sm">
                        Failed to load FAQs.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Please try again later.
                      </p>
                    </div>
                  ) : faqLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                        >
                          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-3" />
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : filteredFAQs && filteredFAQs.length > 0 ? (
                    <div className="space-y-3">
                      {filteredFAQs.map((faq: any, index: number) => (
                        <div
                          key={faq.id}
                          className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                        >
                          <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <HelpCircle className="w-4 h-4 text-blue-600" />
                              </div>
                              <h3 className="font-semibold text-sm md:text-base text-gray-900 break-words">
                                {faq.question}
                              </h3>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                expandedFAQ === index ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <div
                            className={`transition-all overflow-hidden ${
                              expandedFAQ === index
                                ? "max-h-96 opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-4 pb-4 pl-16 border-t border-gray-100">
                              <p className="text-sm md:text-base text-gray-700 leading-relaxed pt-3">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-sm">
                        No FAQs found.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {searchQuery
                          ? "Try a different search term"
                          : "Check back later for updates"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Guides Tab */}
              {activeTab === "guides" && (
                <>
                  {guideError ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-600 font-semibold text-sm">
                        Failed to load guides.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Please try again later.
                      </p>
                    </div>
                  ) : guideLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                        >
                          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-3" />
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : filteredGuides && filteredGuides.length > 0 ? (
                    <div className="space-y-3">
                      {filteredGuides.map((guide: any, index: number) => (
                        <div
                          key={guide.id}
                          className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                        >
                          <button
                            onClick={() => toggleGuide(index)}
                            className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <BookOpen className="w-4 h-4 text-emerald-600" />
                              </div>
                              <h3 className="font-semibold text-sm md:text-base text-gray-900 break-words">
                                {guide.title}
                              </h3>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                expandedGuide === index ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <div
                            className={`transition-all overflow-hidden ${
                              expandedGuide === index
                                ? "max-h-[600px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-4 pb-4 pl-16 border-t border-gray-100">
                              <p className="text-sm md:text-base text-gray-700 leading-relaxed pt-3 whitespace-pre-wrap">
                                {guide.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-sm">
                        No guides found.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {searchQuery
                          ? "Try a different search term"
                          : "Check back later for updates"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
