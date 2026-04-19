"use client";

import Link from "next/link";
import LoadingScreen from "@/components/loadingScreen";
import { Search } from "lucide-react";

import { useBillingPropertyList } from "@/hooks/landlord/useBillingPropertyList";

const PropertyListPage = () => {
  const {
    loading,
    filteredProperties,
    searchTerm,
    setSearchTerm,
    formatProvince,
  } = useBillingPropertyList();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">My Properties</h1>
          
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
  
        {filteredProperties.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-600">No properties found.</p>
            <p className="mt-2 text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.property_id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <div className="p-6 flex-grow">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{property.property_name}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg className="h-5 w-5 mr-1 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p>
                      {property.city},{" "}
                      {formatProvince(property.province)}
                    </p>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-1 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <p>Total Units: {property.units.length}</p>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <Link
                    href={`/landlord/billing/viewUnit/${property.property_id}`}
                    className="block w-full"
                  >
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg w-full transition-colors duration-200 flex items-center justify-center">
                      <span>View Units</span>
                      <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

export default PropertyListPage;