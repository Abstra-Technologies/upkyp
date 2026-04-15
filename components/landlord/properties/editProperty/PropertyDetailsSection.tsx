"use client";

import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import { Check } from "lucide-react";

export default function PropertyDetailsSection() {
    const { property, setProperty } = useEditPropertyStore();

    return (
        <div className="space-y-4">

            {/* PROPERTY TYPE */}
            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Property Type
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 mt-2">
                    {PROPERTY_TYPES.map((type) => {
                        const active = property.propertyType === type.value;

                        return (
                            <button
                                key={type.value}
                                onClick={() => setProperty({ propertyType: type.value })}
                                className={`
                  relative
                  flex flex-col items-center justify-center
                  h-[70px] sm:h-[76px]
                  px-1 py-1
                  rounded-md
                  border
                  text-[9px] sm:text-[11px]
                  font-medium
                  transition-all duration-150
                  active:scale-95
                  ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                }
                `}
                            >
                                {active && (
                                    <span className="absolute top-0.5 right-0.5 bg-white text-blue-600 rounded-full p-[1px]">
                    <Check className="w-2 h-2" />
                  </span>
                                )}

                                <span className="text-sm leading-none">
                  {type.icon}
                </span>

                                <span className="mt-0.5 text-center leading-tight line-clamp-2">
                  {type.label}
                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PROPERTY NAME */}
            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Property Name
                </label>

                <div className="mt-1.5 relative">
                    <input
                        name="propertyName"
                        value={property.propertyName ?? ""}
                        onChange={(e) =>
                            setProperty({ propertyName: e.target.value })
                        }
                        placeholder="e.g. Sunrise Apartment"
                        className="
              w-full
              px-3 py-2
              text-sm
              rounded-lg
              border border-gray-300
              bg-gray-200
              text-gray-800
              placeholder:text-gray-500
              shadow-inner
              focus:bg-white
              focus:border-blue-500
              focus:ring-1 focus:ring-blue-500/20
              outline-none
              transition-all
            "
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-gray-300/70" />
                </div>
            </div>

            {/* 🔥 PROPERTY SIZE */}
            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Property Size (sqm)
                </label>

                <div className="mt-1.5 relative">
                    <input
                        type="number"
                        name="floorArea"
                        value={property.floorArea ?? ""}
                        onChange={(e) =>
                            setProperty({ floorArea: Number(e.target.value) })
                        }
                        placeholder="e.g. 45"
                        className="
              w-full
              px-3 py-2
              text-sm
              rounded-lg
              border border-gray-300
              bg-gray-200
              text-gray-800
              placeholder:text-gray-500
              shadow-inner
              focus:bg-white
              focus:border-blue-500
              focus:ring-1 focus:ring-blue-500/20
              outline-none
              transition-all
            "
                    />

                    {/* unit indicator */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            sqm
          </span>

                    <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-gray-300/70" />
                </div>
            </div>

            {/* 🔥 PROPERTY DESCRIPTION */}
            <div>
                <label className="text-xs font-semibold text-gray-700">
                    Property Description
                </label>

                <div className="mt-1.5 relative">
    <textarea
        name="description"
        value={property.description ?? ""}
        onChange={(e) =>
            setProperty({ description: e.target.value })
        }
        placeholder="Describe your property (e.g. Fully furnished studio near Makati CBD...)"
        rows={3}
        className="
        w-full
        px-3 py-2
        text-sm
        rounded-lg

        border border-gray-300
        bg-gray-200
        text-gray-800
        placeholder:text-gray-500

        shadow-inner

        focus:bg-white
        focus:border-blue-500
        focus:ring-1 focus:ring-blue-500/20

        outline-none
        transition-all
        resize-none
      "
    />

                    {/* inset effect */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-gray-300/70" />
                </div>

                {/* helper text */}
                <p className="text-[10px] text-gray-500 mt-1">
                    Keep it short and clear. This will be shown to tenants.
                </p>
            </div>

        </div>
    );
}