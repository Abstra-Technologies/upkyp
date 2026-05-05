'use client';
import { Suspense } from "react";
import { useParams } from "next/navigation";
import MaintenanceRequestForm from "@/components/maintenance/maintenanceRequestForm";

export default function AddMaintenancePage() {
    const params = useParams();
    const agreement_id = params.agreement_id as string;

    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <MaintenanceRequestForm agreementId={agreement_id} />
        </Suspense>
    );
}
