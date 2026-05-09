"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Building2,
  Bed,
  Banknote,
  Sofa,
  Ruler,
  RotateCcw,
  Check,
  Sparkles,
} from "lucide-react";
import { FilterState } from "@/types/types";
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_STYLES,
  FURNISHING_OPTIONS,
  PRICE_RANGES,
  SIZE_PRESETS,
  PESO,
  GESTURE,
  SPRING,
} from "./utils";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";

interface MobileFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function MobileFiltersPanel({
  isOpen,
  onClose,
  filters,
  setFilters,
}: MobileFiltersPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setIsVisible(true);
      setIsAnimatingOut(false);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        setDragOffset(0);
      });
    }
  }, [isOpen, filters]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localFilters) !== JSON.stringify(filters));
  }, [localFilters, filters]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    document.body.style.overflow = "";
    setTimeout(() => {
      onClose();
      setIsVisible(false);
      setDragOffset(0);
      setIsAnimatingOut(false);
    }, 350);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastY.current = touch.clientY;
    lastTime.current = Date.now();
    setIsDragging(true);
    setVelocity(0);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const now = Date.now();
      const deltaY = currentY - lastY.current;
      const deltaTime = now - lastTime.current;

      if (deltaTime > 0) {
        setVelocity(deltaY / deltaTime);
      }

      lastY.current = currentY;
      lastTime.current = now;

      const rawOffset = dragOffset + deltaY;
      if (rawOffset > 0) {
        const resistance = GESTURE.resistance;
        const dampedOffset = Math.pow(rawOffset, resistance) * 2;
        setDragOffset(Math.min(dampedOffset, GESTURE.maxStretch));
      } else {
        setDragOffset(Math.max(rawOffset * 0.1, -30));
      }
    },
    [isDragging, dragOffset]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    const shouldClose =
      dragOffset > GESTURE.dismissDistance ||
      (velocity > GESTURE.dismissVelocity && dragOffset > 50);

    if (shouldClose) {
      handleClose();
    } else {
      setDragOffset(0);
    }

    setVelocity(0);
  }, [dragOffset, velocity, handleClose]);

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setLocalFilters((prev) => {
        if (key === "propertyPreferences" && typeof value === "string") {
          const current = prev.propertyPreferences || [];
          return {
            ...prev,
            propertyPreferences: current.includes(value)
              ? current.filter((v) => v !== value)
              : [...current, value],
          };
        }
        return {
          ...prev,
          [key]: prev[key] === value ? (typeof value === "number" ? 0 : "") : value,
        };
      });
    },
    []
  );

  const handleApply = useCallback(() => {
    setFilters(localFilters);
    handleClose();
  }, [localFilters, setFilters, handleClose]);

  const handleReset = useCallback(() => {
    setLocalFilters({
      searchQuery: filters.searchQuery,
      propertyType: "",
      furnishing: "",
      minPrice: 0,
      maxPrice: 0,
      minSize: 0,
      location: "",
      unitStyle: "",
      propertyPreferences: [],
    });
  }, [filters.searchQuery]);

  const activeCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === "searchQuery") return false;
    if (key === "propertyPreferences") return (value as string[])?.length > 0;
    return typeof value === "number" ? value > 0 : value !== "";
  }).length;

  const getTransform = () => {
    if (isAnimatingOut) return "translateY(100%)";
    if (!isVisible) return "translateY(100%)";
    return `translateY(${Math.max(0, dragOffset)}px)`;
  };

  const getBackdropOpacity = () => {
    if (isAnimatingOut) return 0;
    if (!isVisible) return 0;
    if (isDragging) return Math.max(0, 1 - dragOffset / 400);
    return 1;
  };

  if (!mounted || !isVisible) return null;

  const content = (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: getBackdropOpacity() }}
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-[32px] shadow-2xl flex flex-col will-change-transform mx-auto"
        style={{
          maxHeight: "92vh",
          maxWidth: "380px",
          width: "100%",
          transform: getTransform(),
          transition: isDragging ? "none" : `transform 0.4s ${SPRING.apple}`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className={`rounded-full transition-all duration-200 ${
              isDragging
                ? "w-16 h-1.5 bg-emerald-400"
                : "w-12 h-1.5 bg-slate-300"
            }`}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Filters</h2>
              <p className="text-sm text-slate-500">Refinea your search</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-3 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Reset Button */}
        {activeCount > 0 && (
          <div className="px-6 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Price Range */}
          <FilterSection
            title="Price Range"
            icon={<Banknote className="w-5 h-5 text-amber-600" />}
            delay={0}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {PRICE_RANGES.map((range, idx) => (
                <FilterChip
                  key={idx}
                  label={range.label}
                  isSelected={
                    localFilters.minPrice === range.min &&
                    localFilters.maxPrice === range.max
                  }
                  onClick={() => {
                    if (
                      localFilters.minPrice === range.min &&
                      localFilters.maxPrice === range.max
                    ) {
                      updateFilter("minPrice", 0);
                      updateFilter("maxPrice", 0);
                    } else {
                      updateFilter("minPrice", range.min);
                      updateFilter("maxPrice", range.max);
                    }
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Min
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    {PESO}
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={localFilters.minPrice || ""}
                    onChange={(e) =>
                      updateFilter("minPrice", Number(e.target.value) || 0)
                    }
                    className="w-full h-12 pl-9 pr-4 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
              <span className="text-slate-300 font-medium mt-6">-</span>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Max
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    {PESO}
                  </span>
                  <input
                    type="number"
                    placeholder="Any"
                    value={localFilters.maxPrice || ""}
                    onChange={(e) =>
                      updateFilter("maxPrice", Number(e.target.value) || 0)
                    }
                    className="w-full h-12 pl-9 pr-4 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection
            title="Location"
            icon={<MapPin className="w-5 h-5 text-emerald-600" />}
            delay={50}
          >
            <div className="grid grid-cols-4 gap-2">
              {LOCATIONS.map((loc) => (
                <LocationCard
                  key={loc.value}
                  label={loc.label}
                  isSelected={localFilters.location === loc.value}
                  onClick={() => toggleFilter("location", loc.value)}
                  popular={loc.popular}
                />
              ))}
            </div>
          </FilterSection>

          {/* Property Type */}
          <FilterSection
            title="Property Type"
            icon={<Building2 className="w-5 h-5 text-blue-600" />}
            delay={100}
          >
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <FilterChip
                  key={type.value}
                  label={type.label}
                  isSelected={localFilters.propertyType === type.value}
                  onClick={() => toggleFilter("propertyType", type.value)}
                  fullWidth
                />
              ))}
            </div>
          </FilterSection>

          {/* Unit Style */}
          <FilterSection
            title="Unit Style"
            icon={<Bed className="w-5 h-5 text-purple-600" />}
            delay={150}
          >
            <div className="grid grid-cols-2 gap-2">
              {UNIT_STYLES.map((style) => (
                <FilterChip
                  key={style.value}
                  label={style.label}
                  isSelected={localFilters.unitStyle === style.value}
                  onClick={() => toggleFilter("unitStyle", style.value)}
                  fullWidth
                />
              ))}
            </div>
          </FilterSection>

          {/* Furnishing */}
          <FilterSection
            title="Furnishing"
            icon={<Sofa className="w-5 h-5 text-teal-600" />}
            delay={300}
          >
            <div className="flex flex-wrap gap-2">
              {FURNISHING_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  isSelected={localFilters.furnishing === opt.value}
                  onClick={() => toggleFilter("furnishing", opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Minimum Size */}
          <FilterSection
            title="Minimum Size"
            icon={<Ruler className="w-5 h-5 text-indigo-600" />}
            delay={250}
          >
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((size) => (
                <FilterChip
                  key={size}
                  label={`${size}+ sqm`}
                  isSelected={localFilters.minSize === size}
                  onClick={() => toggleFilter("minSize", size)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Property Preferences */}
          <FilterSection
            title="Property Preferences"
            icon={
              <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            delay={300}
          >
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_PREFERENCES.map((pref) => {
                const Icon = pref.icon;
                const isSelected = localFilters.propertyPreferences?.includes(pref.key) || false;
                return (
                  <FilterChip
                    key={pref.key}
                    label={pref.label}
                    isSelected={isSelected}
                    onClick={() => toggleFilter("propertyPreferences", pref.key)}
                    fullWidth
                  />
                );
              })}
            </div>
          </FilterSection>

          <div className="h-32" />
        </div>

        {/* Fixed Footer */}
        <div className="sticky bottom-0 p-4 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={activeCount === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold transition-all active:scale-95 ${
                activeCount === 0
                  ? "bg-slate-100 text-slate-400"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              {hasChanges ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Apply Filters
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Done
                </>
              )}
              {activeCount > 0 && (
                <span className="ml-1 px-2.5 py-0.5 bg-white/20 rounded-full text-sm">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function FilterSection({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`py-5 border-b border-slate-100 last:border-b-0 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  isSelected,
  onClick,
  badge,
  fullWidth = false,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-4 py-3 rounded-xl font-medium text-sm
        transition-all duration-200 active:scale-95
        ${fullWidth ? "w-full" : ""}
        ${
          isSelected
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }
      `}
    >
      {label}
      {badge && (
        <span
          className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            isSelected
              ? "bg-white text-emerald-600"
              : "bg-emerald-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function LocationCard({
  label,
  isSelected,
  onClick,
  popular,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  popular?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg transition-all duration-200 active:scale-95
        ${isSelected
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }
        ${isSelected ? "ring-2 ring-emerald-500 ring-offset-1" : ""}
        relative flex items-center justify-center
      `}
    >
      <span className="text-xs font-semibold text-center truncate">
        {label}
      </span>
      {popular && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-blue-500 text-white rounded-full">
          Top
        </span>
      )}
    </button>
  );
}
