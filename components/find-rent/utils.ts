// ============================================================
// UPKYP FIND-RENT UTILITIES
// ============================================================

import { Building2, Home, Building, Warehouse, BedDouble, Bed, Armchair, LampFloor } from "lucide-react";

// Peso symbol constant (prevents Unicode issues)
export const PESO = "\u20B1";

// Animation timing functions
export const SPRING = {
  snappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  apple: "cubic-bezier(0.25, 0.1, 0.25, 1)",
} as const;

// Gesture thresholds for touch interactions
export const GESTURE = {
  dismissVelocity: 0.5,
  dismissDistance: 100,
  resistance: 0.55,
  maxStretch: 120,
} as const;

// Property type configurations - 3 main categories
export const PROPERTY_TYPES = [
  { value: "residential", label: "Residential", icon: Home },
  { value: "commercial", label: "Commercial", icon: Building },
  { value: "mixed", label: "Mixed Use", icon: Building2 },
] as const;

// Property subtypes per category
export const PROPERTY_SUBTYPES: Record<string, { value: string; label: string }[]> = {
  residential: [
    { value: "Apartment", label: "Apartment" },
    { value: "House", label: "House" },
    { value: "Townhouse", label: "Townhouse" },
    { value: "Condominium", label: "Condominium" },
    { value: "Duplex", label: "Duplex" },
    { value: "Dormitory", label: "Dormitory" },
  ],
  commercial: [
    { value: "Office Space", label: "Office Space" },
    { value: "Warehouse", label: "Warehouse" },
    { value: "Retail Unit", label: "Retail Unit" },
    { value: "Industrial Space", label: "Industrial Space" },
  ],
  mixed: [
    { value: "Mixed Use", label: "Mixed Use" },
  ],
};

// Unit style configurations
export const UNIT_STYLES = [
  { value: "studio", label: "Studio", icon: Bed },
  { value: "1-bedroom", label: "1 Bedroom", icon: Bed },
  { value: "2-bedroom", label: "2 Bedroom", icon: BedDouble },
  { value: "3-bedroom", label: "3+ Bedroom", icon: BedDouble },
  { value: "penthouse", label: "Penthouse", icon: Building },
] as const;

// Furnishing options
export const FURNISHING_OPTIONS = [
  { value: "fully_furnished", label: "Fully Furnished", icon: Armchair },
  { value: "semi_furnished", label: "Semi Furnished", icon: LampFloor },
  { value: "unfurnished", label: "Unfurnished", icon: Building2 },
] as const;

// Philippine regions/locations
export const LOCATIONS = [
  { value: "metro_manila", label: "Metro Manila", popular: false },
  { value: "cebu", label: "Cebu", popular: false },
  { value: "davao", label: "Davao", popular: false },
  { value: "laguna", label: "Laguna", popular: false },
  { value: "cavite", label: "Cavite", popular: false },
  { value: "bulacan", label: "Bulacan", popular: false },
  { value: "pampanga", label: "Pampanga", popular: false },
  { value: "batangas", label: "Batangas", popular: false },
  { value: "rizal", label: "Rizal", popular: false },
  { value: "iloilo", label: "Iloilo", popular: false },
  { value: "pangasinan", label: "Pangasinan", popular: false },
  { value: "zambales", label: "Zambales", popular: false },
] as const;

// Price range presets
export const PRICE_RANGES = [
  { min: 0, max: 5000, label: `Under 5K` },
  { min: 5000, max: 10000, label: `5K - 10K` },
  { min: 10000, max: 20000, label: `10K - 20K` },
  { min: 20000, max: 35000, label: `20K - 35K` },
  { min: 35000, max: 50000, label: `35K - 50K` },
  { min: 50000, max: 0, label: `50K+` },
] as const;

// Size presets (in sqm)
export const SIZE_PRESETS = [15, 25, 35, 50, 75, 100] as const;

// Format currency helper
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format location helper
export const formatLocation = (city: string, province: string): string => {
  const format = (str: string) =>
    str
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  return `${format(city)}, ${format(province)}`;
};

// Format unit style helper
export const formatUnitStyle = (style: string): string => {
  if (!style) return "";
  return style
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Cluster configuration for map
export const CLUSTER_CONFIG = {
  overlapThreshold: 40,
  spiderfyRadius: 60,
  maxSpiderfyItems: 8,
} as const;
