"use client";

import { useState } from "react";
import {
    Building2,
    MapPin,
    ImagePlus,
} from "lucide-react";

import PropertyDetailsSection from "./PropertyDetailsSection";
import LocationFeaturesSection from "./LocationFeaturesSection";
import PhotosSection from "./PhotosSection";

/* =========================================
   GROUP ACCORDION
========================================= */
function GroupAccordion({
                            title,
                            icon: Icon,
                            children,
                            defaultOpen,
                            locked,
                        }: any) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className={`
        border border-gray-300
        rounded-xl
        bg-white
        shadow-sm
        overflow-hidden
      `}
        >
            {/* HEADER */}
            <button
                onClick={() => !locked && setOpen(!open)}
                className={`
          w-full
          flex justify-between items-center
          px-4 py-3
          bg-gray-50
          hover:bg-gray-100
          transition-all
        `}
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-50 border border-blue-100">
                        <Icon className="w-4 h-4 text-blue-600" />
                    </div>

                    <span className="font-semibold text-sm text-gray-800">
            {title}
          </span>
                </div>

                {!locked && (
                    <span
                        className={`
              text-gray-500 text-sm font-semibold
              transition-transform duration-200
              ${open ? "rotate-180" : ""}
            `}
                    >
            ▼
          </span>
                )}
            </button>

            {/* CONTENT */}
            {open && (
                <div
                    className="
            px-4 pt-3 pb-4
            border-t border-gray-200
            bg-white
          "
                >
                    {children}
                </div>
            )}
        </div>
    );
}
/* =========================================
   MAIN FORM
========================================= */
export default function EditPropertyForm() {
    return (
        <div className="space-y-3">

            {/* GROUP 1 */}
            <GroupAccordion
                title="Property Details"
                icon={Building2}
                defaultOpen
                locked
            >
                <PropertyDetailsSection />
            </GroupAccordion>

            {/* GROUP 2 */}
            <GroupAccordion title="Location & Features" icon={MapPin}>
                <LocationFeaturesSection />
            </GroupAccordion>

            {/* GROUP 3 */}
            <GroupAccordion title="Photos" icon={ImagePlus}>
                <PhotosSection />
            </GroupAccordion>

        </div>
    );
}