"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { Search, Building2, FileText, CreditCard, X, ChevronRight } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Property {
  property_id: string;
  property_name: string;
  city: string;
  province: string;
}

interface PropertySearchProps {
  landlordId: string;
}

export default function PropertySearch({ landlordId }: PropertySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: properties = [], isLoading } = useSWR<Property[]>(
    landlordId ? `/api/propertyListing/getPropertyperLandlord?landlord_id=${landlordId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const filteredProperties = query
    ? properties.filter((p) =>
        p.property_name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search properties..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 sm:pl-11 pr-9 sm:pr-11 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-200 border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-blue-50 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 hover:bg-gray-300 rounded-full transition-colors"
          >
            <X className="w-3.5 sm:w-4 text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-72 sm:max-h-96 overflow-y-auto scrollbar-none">
          {isLoading ? (
            <div className="p-4 sm:p-6 text-center text-sm sm:text-base text-gray-500">Loading...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-sm sm:text-base text-gray-500">No properties found</div>
          ) : (
            <div className="py-2 sm:py-3">
              {filteredProperties.map((property) => (
                <div key={property.property_id} className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-50 last:border-b-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <Building2 className="w-4 sm:w-5 text-blue-600" />
                    <span className="text-sm sm:text-base font-medium sm:font-semibold text-gray-900">
                      {property.property_name}
                    </span>
                    <ChevronRight className="w-3.5 sm:w-4 text-gray-400 ml-auto" />
                  </div>
                  <div className="pl-6 sm:pl-8 space-y-1">
                    <Link
                      href={`/landlord/properties/${property.property_id}/activeLease`}
                      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base text-gray-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <FileText className="w-3.5 sm:w-4" />
                      View Active Lease
                    </Link>
                    <Link
                      href={`/landlord/properties/${property.property_id}/billing`}
                      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base text-gray-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <CreditCard className="w-3.5 sm:w-4" />
                      View Billing
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}