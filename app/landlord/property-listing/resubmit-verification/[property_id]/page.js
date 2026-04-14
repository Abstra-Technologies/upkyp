"use client";
import { useParams } from "next/navigation";
import ResubmitVerification from "@/components/property/ResubmitVerification";
import { Suspense, useEffect, useState } from "react";

export default function ResubmitVerificationPage() {
  const { property_id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch property details including verification message
  useEffect(() => {
    if (property_id) {
      fetch(`/api/propertyListing/propListing?property_id=${property_id}`)
        .then((res) => res.json())
        .then((data) => {
          setProperty(data[0]);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching property:", error);
          setLoading(false);
        });
    }
  }, [property_id]);

  if (loading) return <p>Loading property details...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-lg font-bold mb-4">
          Resubmit Property Verification
        </h1>

        {/* Show verification message if rejected */}
        {property?.verification_status === "Rejected" && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            <strong>Reason:</strong>{" "}
            {property?.admin_message || "No message provided."}
          </div>
        )}

        <Suspense fallback={<p>Loading verification form...</p>}>
          <ResubmitVerification property_id={property_id} />
        </Suspense>
      </div>
    </div>
  );
}
