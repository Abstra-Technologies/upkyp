"use client";

import { useEffect, useState } from "react";
import {
  HomeIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface UnitInfo {
  unit_id: number;
  unit_name: string;
  property_name: string;
  status: string;
  agreement_id:string;
}

interface ActiveRentConsolidatedCardsProps {
  tenant_id?: number;
}

export default function ActiveRentConsolidatedCards({
  tenant_id,
}: ActiveRentConsolidatedCardsProps) {
  const [totalActive, setTotalActive] = useState<number>(0);
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const router = useRouter();

  useEffect(() => {
    if (!tenant_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/analytics/tenant/consolidated/activeRentals?tenant_id=${tenant_id}`
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch data");
        }
        const data = await res.json();
        setTotalActive(data.totalActiveUnits || 0);
        setUnits(data.units || []);
      } catch (err: any) {
        console.error("Active rentals error:", err);
        setError(err.message || "Unable to load rental data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant_id]);

  const paginatedUnits = units?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil((units?.length || 0) / itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-3 border-transparent border-t-emerald-500"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium mt-3">
          Loading rentals...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
          <ExclamationCircleIcon className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-red-600 text-center text-sm font-semibold">
          {error}
        </p>
        <p className="text-gray-500 text-xs mt-1">Please try again</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <HomeIcon className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Active Rentals
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
            {totalActive}
          </p>
          <span className="text-sm font-medium text-gray-500 pb-0.5">
            {totalActive === 1 ? "property" : "properties"}
          </span>
        </div>
      </div>

      {units && units.length > 0 ? (
        <>
          <div className="flex-1 space-y-3 min-h-0">
              {paginatedUnits?.map((unit) => (
                  <div
                      key={`active-rental-${unit.unit_id}`}
                      className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() =>
                          router.push(`/tenant/rentalPortal/${unit.agreement_id}`)
                      }
                  >
                      <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <HomeIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">
                                  {unit.unit_name}
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5 truncate">
                                  {unit.property_name}
                              </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg flex-shrink-0">
        Active
      </span>
                      </div>
                  </div>
              ))}

          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Prev
              </button>
              <span className="text-xs font-medium text-gray-600">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
            <HomeIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 text-center text-sm font-semibold">
            No active rentals
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Start exploring properties
          </p>
        </div>
      )}
    </div>
  );
}
