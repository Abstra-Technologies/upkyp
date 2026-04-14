'use client'


import useAuthStore from "@/zustand/authStore";
import TenantListLandlords from "@/components/landlord/properties/listOfCurrentTenants";


export default function LandlordsTenantsListPage() {
  const { fetchSession, user, admin } = useAuthStore();
    return (
            <TenantListLandlords landlord_id={user?.landlord_id} />
    );
}
