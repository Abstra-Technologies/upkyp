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
    { id: "notifications-section", label: "Notifications", icon: Bell },
    { id: "late-payment-section", label: "Penalties", icon: DollarSign },
    { id: "utility-billing-section", label: "Utility", icon: Droplets },
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
      await axios.get("/api/propertyListing/getPropDetailsById", {
        params: { property_id },
      });
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
    if (typeof window !== "undefined" && (window as any).startPropertyConfigTour) {
      (window as any).startPropertyConfigTour();
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Property Configuration
            </h1>
            <p className="text-xs text-gray-600">
              Manage billing settings
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout - Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">
                    Property Configuration
                  </h2>
                  <p className="text-xs text-gray-600">
                    Manage billing settings
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 px-2">
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
                      <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                            {section.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleShowGuide}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Show Guide</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Section Buttons */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
              >
                <Icon className="w-4 h-4 text-blue-600" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <PropertyConfiguration
            propertyId={property_id}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}