"use client";
import { useParams, useSearchParams } from "next/navigation";
import UnitDetails from "@/components/landlord/properties/unitDetails";

const ViewUnitTenantPage = () => {
    const { unitId } = useParams();
    const searchParams = useSearchParams();
    const tenantId = searchParams.get("tenant_id");
    if (!unitId) {
        return <div>Error: Missing unit ID</div>;
    }

    return (
        <UnitDetails unitId={unitId} />
    );

};

export default ViewUnitTenantPage;