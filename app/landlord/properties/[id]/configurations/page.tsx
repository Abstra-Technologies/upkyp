"use client";

import { useParams } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import PropertyConfiguration from "@/components/landlord/properties/propertyConfigSettings";
import { Settings, HelpCircle } from "lucide-react";
import RecurringCharges from "@/components/landlord/properties/RecurringCharges";

export default function PropertyConfigurationPage() {
  const { id } = useParams();
  const property_id = id;
  const [isUpdating, setIsUpdating] = useState(false);

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
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Property Configuration
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Manage billing rules, reminders, and late fee settings
                </p>
              </div>
            </div>

            <button
              onClick={handleShowGuide}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Show Guide</span>
            </button>
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
  );
}
