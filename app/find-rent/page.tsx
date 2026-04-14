"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import { Unit, FilterState } from "@/types/types";

// Import components from the find-rent folder
import MobileSearchHeader from "@/components/find-rent/MobileSearchHeader";
import GridView from "@/components/find-rent/GridView";
import MapView from "@/components/find-rent/MapView";
import MobileFiltersPanel from "@/components/find-rent/MobileFiltersPanel";
import UnitCard from "@/components/find-rent/UnitCard";
import LoadingScreen from "@/components/loadingScreen";

function getFiltersFromUrl(params: URLSearchParams | null): FilterState {
  return {
    searchQuery: params?.get("searchQuery") || "",
    propertyType: params?.get("propertyType") || "",
    furnishing: params?.get("furnishing") || "",
    minPrice: Number(params?.get("minPrice")) || 0,
    maxPrice: Number(params?.get("maxPrice")) || 0,
    minSize: Number(params?.get("minSize")) || 0,
    location: params?.get("location") || "",
    unitStyle: params?.get("unitStyle") || "",
  };
}

function UnitSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // State
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "split">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const itemsPerPage = 12;

  // Derived state
  const filters = useMemo(
    () => getFiltersFromUrl(searchParams),
    [searchParams]
  );
  const currentPage = Number(searchParams?.get("page")) || 1;

  // Create URL params
  const createParams = useCallback(
    (newFilters: FilterState, newPage: number) => {
      const params = new URLSearchParams();
      const q = (newFilters.searchQuery || "").trim();
      if (q) params.set("searchQuery", q);
      if (newFilters.propertyType)
        params.set("propertyType", newFilters.propertyType);
      if (newFilters.furnishing)
        params.set("furnishing", newFilters.furnishing);
      if (newFilters.minPrice > 0)
        params.set("minPrice", String(newFilters.minPrice));
      if (newFilters.maxPrice > 0)
        params.set("maxPrice", String(newFilters.maxPrice));
      if (newFilters.minSize > 0)
        params.set("minSize", String(newFilters.minSize));
      if (newFilters.location) params.set("location", newFilters.location);
      if (newFilters.unitStyle) params.set("unitStyle", newFilters.unitStyle);
      if (newPage > 1) params.set("page", String(newPage));
      return params;
    },
    []
  );

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      const params = createParams(newFilters, 1);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, createParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = createParams(filters, page);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, pathname, filters, createParams]
  );

  const handleClearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const handleUnitClick = useCallback(
    (unitId: string, propertyId: string) => {
      router.push(`/pages/find-rent/${propertyId}/${unitId}`);
    },
    [router]
  );

  const handleViewModeChange = useCallback(
    (mode: "grid" | "map" | "split") => {
      if (mode === viewMode) return;
      setIsViewTransitioning(true);
      setTimeout(() => {
        setViewMode(mode);
        setTimeout(() => setIsViewTransitioning(false), 50);
      }, 150);
    },
    [viewMode]
  );

  // Fetch units
  useEffect(() => {
    async function fetchUnits() {
      try {
        const res = await fetch("/api/properties/findRent/units");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUnits(data?.data || []);
      } catch (err) {
        console.error(err);
        setUnits([]);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    }
    fetchUnits();
  }, []);

  // Filter units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const search = (filters.searchQuery || "").toLowerCase().trim();
      const matchesSearch =
        !search ||
        unit.property_name.toLowerCase().includes(search) ||
        unit.city.toLowerCase().includes(search) ||
        unit.province.toLowerCase().replace(/_/g, " ").includes(search);

      const matchesType =
        !filters.propertyType ||
        unit.property_type.toLowerCase() === filters.propertyType.toLowerCase();

      const matchesFurnishing =
        !filters.furnishing ||
        unit.furnish.toLowerCase() === filters.furnishing.toLowerCase();

      const price = Number(unit.rent_amount);
      const matchesMinPrice = !filters.minPrice || price >= filters.minPrice;
      const matchesMaxPrice = !filters.maxPrice || price <= filters.maxPrice;
      const matchesMinSize =
        !filters.minSize || unit.unit_size >= filters.minSize;

      const matchesLocation =
        !filters.location ||
        unit.province.toLowerCase() === filters.location.toLowerCase();

      const matchesStyle =
        !filters.unitStyle ||
        unit.unit_style.toLowerCase() === filters.unitStyle.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesFurnishing &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSize &&
        matchesLocation &&
        matchesStyle
      );
    });
  }, [units, filters]);

  // Active filter count
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchQuery") return false;
    return typeof value === "number" ? value > 0 : value !== "";
  }).length;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Subtle pattern background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - Now positioned below navbar */}
      <MobileSearchHeader
        filters={filters}
        setFilters={handleFiltersChange}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        totalResults={filteredUnits.length}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setShowFilters(true)}
      />

      {/* Main Content */}
      <main className="relative">
        <div
          className={`transition-opacity duration-200 ${
            isViewTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Grid View */}
          {viewMode === "grid" && (
            <GridView
              units={filteredUnits}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onUnitClick={handleUnitClick}
              onPageChange={handlePageChange}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* Map View - Adjusted height for navbar + search header */}
          {viewMode === "map" && (
            <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-220px)]">
              {/* 
                Height calculation:
                - Mobile: 100vh - 56px navbar - ~144px header = ~200px total
                - Desktop: 100vh - 64px navbar - ~156px header = ~220px total
              */}
              <MapView units={filteredUnits} onUnitClick={handleUnitClick} />
            </div>
          )}

          {/* Split View - Desktop Only */}
          {viewMode === "split" && (
            <div className="hidden lg:flex h-[calc(100vh-220px)]">
              {/* Map */}
              <div className="flex-1 p-4">
                <MapView units={filteredUnits} onUnitClick={handleUnitClick} />
              </div>

              {/* List */}
              <div className="w-[420px] border-l border-slate-200 overflow-y-auto bg-white">
                <div className="p-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                  <h2 className="font-bold text-slate-900">
                    {filteredUnits.length} Units
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {filteredUnits.slice(0, 20).map((unit) => (
                    <UnitCard
                      key={unit.unit_id}
                      unit={unit}
                      onClick={() =>
                        handleUnitClick(unit.unit_id, unit.property_id)
                      }
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Filter Sheet */}
      <MobileFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={handleFiltersChange}
      />
    </div>
  );
}

export default function UnitSearchPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <UnitSearchContent />
    </Suspense>
  );
}
