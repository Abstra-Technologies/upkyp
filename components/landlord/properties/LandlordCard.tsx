"use client";

import { useEffect, useState } from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Landlord {
  landlord_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  photoUrl?: string;
}

export default function LandlordCard({ landlord_id }: { landlord_id: string }) {
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log('landlord card: ', landlord_id);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchLandlord = async () => {
      try {
        const res = await fetch(`/api/landlord/${landlord_id}`);
        if (!res.ok) throw new Error("Failed to fetch landlord details");
        const data = await res.json();
        setLandlord(data);
      } catch (error) {
        console.error("Error fetching landlord:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandlord();
  }, [landlord_id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleClick = () => {
    router.push(`/public/${landlord?.landlord_id}`);
  };

  if (!landlord) return null;

  return (
    <div
      className="flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Avatar */}
      {landlord.photoUrl ? (
        <img
          src={landlord.photoUrl}
          alt={landlord.name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
          {landlord.name?.charAt(0) || "H"}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {landlord.name}
          </h3>
          {landlord.company && (
            <p className="text-sm text-gray-600">{landlord.company}</p>
          )}
        </div>

        {/* Contact */}
        <div className="space-y-1">
          {landlord.phone && (
            <a
              href={`tel:${landlord.phone}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <FaPhoneAlt className="w-3.5 h-3.5" />
              <span>{landlord.phone}</span>
            </a>
          )}
          {landlord.email && (
            <a
              href={`mailto:${landlord.email}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <FaEnvelope className="w-3.5 h-3.5" />
              <span className="truncate">{landlord.email}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
