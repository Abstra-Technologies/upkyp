"use client";

import { useParams } from "next/navigation";
import PropertyDocumentsTab from "@/components/landlord/properties/PropertyDocumentsTab";

export default function PropertyDocumentsDetailPage() {
  const { id } = useParams();
  const property_id = id;

  return (
    <div className="pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Document Tab Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <PropertyDocumentsTab propertyId={property_id} />
        </div>
      </div>
    </div>
  );
}
