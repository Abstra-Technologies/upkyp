"use client";

import { useParams } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import PropertyConfiguration from "@/components/landlord/properties/propertyConfigSettings";
import { Settings, HelpCircle, Bell, DollarSign, Droplets, ChevronRight } from "lucide-react";

export default function PropertyConfigurationPage() {
  const { id } = useParams();
  const property_id = id;
  const [isUpdating, setIsUpdating] = useState(false);

  const sections = [
    { id: "notifications-section", label: "Notifications & Reminders", icon: Bell },
    { id: "late-payment-section", label: "Penalties & Other Dues", icon: DollarSign },
    { id: "utility-billing-section", label: "Utility Configuration", icon: Droplets },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await axios.get(
        "/api/propertyListing/getPropDetailsById",
        {
          params: { property_id },
        }
      );
    } catch (error) {
      console.error("Failed to reload property details after update:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Could not refresh property details after update.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowGuide = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).startPropertyConfigTour
    ) {
      (window as any).startPropertyConfigTour();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop Only */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header in Sidebar */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">
                      Property Configuration
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5 leading-tight">
                      Manage billing rules, reminders, and late fee settings
                    </p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 px-2">
                  Sections
                </p>
                <nav className="space-y-1">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                              {section.label}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Show Guide */}
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={handleShowGuide}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Show Guide</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header - Mobile Only */}
            <div className="lg:hidden mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Property Configuration
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Manage billing rules, reminders, and late fee settings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Section Nav */}
            <div className="lg:hidden mb-5 -mx-4 px-4 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-colors"
                    >
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/*<div className="mt-6">*/}
            {/*    <RecurringCharges propertyId={property_id} />*/}
            {/*</div>*/}

            {/* Configuration Component */}
            <PropertyConfiguration
              propertyId={property_id}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}