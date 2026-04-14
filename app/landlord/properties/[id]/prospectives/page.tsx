"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "@/components/landlord/prospective/InterestedTenants";
import useAuthStore from "@/zustand/authStore";

export default function TenantRequest() {
  const { id } = useParams();
  const propertyId = id;
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const { fetchSession, user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetchSession();
    }
  }, [user, fetchSession]);

  useEffect(() => {
    if (user) {
      setLandlordId(user.landlord_id);
    }
  }, [user]);

  return <InterestedTenants propertyId={propertyId} landlordId={landlordId} />;
}
