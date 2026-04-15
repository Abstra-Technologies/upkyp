"use client";

import { AMENITIES_LIST } from "@/constant/amenities";
import { Check } from "lucide-react";

const AmenitiesSelector = ({ selectedAmenities = [], onAmenityChange }) => {
    return (
        <div className="max-h-[280px] overflow-y-auto">

            {/* GRID */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 mt-1">
                {AMENITIES_LIST.map(({ name, icon }) => {
                    const isSelected = selectedAmenities.includes(name);

                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => onAmenityChange(name)}
                            className={`
                relative
                flex flex-col items-center justify-center
                h-[64px] sm:h-[70px]
                px-1 py-1
                rounded-md
                border
                text-[8px] sm:text-[10px]
                font-medium
                transition-all duration-150
                active:scale-95
                ${
                                isSelected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                            }
              `}
                        >
                            {/* CHECK */}
                            {isSelected && (
                                <span className="absolute top-0.5 right-0.5 bg-white text-blue-600 rounded-full p-[1px]">
                  <Check className="w-2 h-2" />
                </span>
                            )}

                            {/* ICON */}
                            <span className="text-sm leading-none">
                {icon}
              </span>

                            {/* LABEL */}
                            <span className="mt-0.5 text-center leading-tight line-clamp-2">
                {name}
              </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AmenitiesSelector;