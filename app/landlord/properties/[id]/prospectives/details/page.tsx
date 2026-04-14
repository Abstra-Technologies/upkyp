"use client";
import { useSearchParams, useParams } from "next/navigation";
import ProspectiveTenantDetails from "@/components/landlord/prospective/ProspectiveTenantDetails";

const ProspectiveTenantDetailedPage = () => {
    const { id } = useParams();
    const propertyId = id;

    const searchParams = useSearchParams();
    const tenantId = searchParams.get("tenant_id");
    const unitId = searchParams.get("unit_id");

    if (!tenantId || !unitId) {
        return (
                <div className="min-h-screen flex items-center justify-center text-red-600 font-medium">
                    Missing required parameters (tenant_id or unit_id)
                </div>
        );
    }

    return (
            <ProspectiveTenantDetails
                unitId={unitId}
                tenantId={tenantId}
            />
    );
};

export default ProspectiveTenantDetailedPage;
